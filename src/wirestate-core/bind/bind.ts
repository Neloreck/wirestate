import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import {
  BindingType as BindingTypeValues,
  BindingScope as BindingScopeValues,
  Container,
  Newable,
  Identifier,
} from "../alias";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import {
  Binding,
  BindingType,
  BindingScope,
  ValueBindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
} from "../types/provision";

import { createInstanceActivatedHandler } from "./instance/instance-activated";
import { createInstanceDeactivationHandler } from "./instance/instance-deactivation";
import { registerBinding } from "./utils/register-binding";

/**
 * Describes options for {@link bind}.
 *
 * @group Bind
 */
export interface BindOptions {
  /**
   * Skip `@OnActivated` and `@OnDeactivation` hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipActivationHooks?: boolean;
}

/**
 * Shared shape of unvalidated binding descriptors.
 *
 * @internal
 */
interface UnsafeBindingDescriptor {
  readonly type?: unknown;
  readonly scope?: unknown;
  readonly token?: unknown;
}

/**
 * Validates fields shared by every binding descriptor.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor has no `token`,
 * an unknown `type`, or an unknown `scope`.
 */
function validateDescriptor(binding: UnsafeBindingDescriptor): void {
  if (
    !Object.prototype.hasOwnProperty.call(binding, "token") ||
    binding.token === undefined ||
    binding.token === null
  ) {
    throw new WirestateError("Binding descriptor must provide a 'token' property.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  if (binding.type !== undefined && !Object.values(BindingTypeValues).includes(binding.type as BindingType)) {
    throw new WirestateError(
      `Binding descriptor has unknown type '${String(binding.type)}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (binding.scope !== undefined && !Object.values(BindingScopeValues).includes(binding.scope as BindingScope)) {
    throw new WirestateError(
      `Binding descriptor has unknown scope '${String(binding.scope)}'.`,
      ERROR_CODE_INVALID_BINDING_SCOPE
    );
  }
}

/**
 * Binds a static value descriptor.
 *
 * @group Bind
 * @internal
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token` and `value`.
 *
 * @throws {@link WirestateError} If the descriptor omits `value` or uses a non-singleton scope.
 */
function bindValueDescriptor<T>(container: Container, descriptor: ValueBindingDescriptor<T>): void {
  if (descriptor.scope && descriptor.scope !== BindingScopeValues.Singleton) {
    throw new WirestateError("Provided unexpected binding scope for value.", ERROR_CODE_INVALID_BINDING_SCOPE);
  }

  if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) {
    throw new WirestateError("Value descriptor must provide a 'value' property.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  dbg.info(prefix(__filename), "Binding value:", { token: descriptor.token, descriptor, container });

  container.bind({ token: descriptor.token as Identifier<T>, value: descriptor.value as T });
}

/**
 * Binds a factory descriptor.
 *
 * @remarks
 * The factory runs inside the injection context, so `inject()` works in its body
 * to resolve dependencies. With the default `Singleton` scope the factory runs once
 * and its value is cached; with `Transient` scope it runs on every resolution.
 *
 * @group Bind
 * @internal
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token`, `factory`, and optional scope.
 *
 * @throws {@link WirestateError} If `factory` is not a function.
 */
function bindFactoryDescriptor<T>(container: Container, descriptor: FactoryBindingDescriptor<T>): void {
  if (typeof descriptor.factory !== "function") {
    throw new WirestateError("Factory descriptor 'factory' must be a function.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  dbg.info(prefix(__filename), "Binding factory:", { descriptor, container });

  container.bind({
    token: descriptor.token,
    type: "Factory",
    scope: descriptor.scope,
    factory: (current) => descriptor.factory(current),
  });
}

/**
 * Binds a constructor behind a token while wiring Wirestate instance lifecycle.
 *
 * @remarks
 * The binding does four jobs:
 *
 * - Resolves one instance per container.
 * - Runs `@OnActivated` and `@OnDeactivation`.
 * - Registers `@OnEvent`, `@OnCommand`, and `@OnQuery` handlers.
 * - Tracks instance lifecycle state for {@link WireStatus}.
 *
 * @group Bind
 * @internal
 *
 * @template T - Type of the instance.
 *
 * @param container - Target {@link Container}.
 * @param token - Token used to resolve the binding.
 * @param binding - Class constructor.
 * @param options - Configuration options for the binding.
 *
 * @throws {@link WirestateError} If the descriptor value is not a constructor.
 */
function bindInstanceDescriptor<T extends object>(
  container: Container,
  token: Identifier<T>,
  binding: Newable<T>,
  options?: BindOptions
): void {
  if (typeof binding !== "function") {
    throw new WirestateError("Instance descriptor 'value' must be a constructor.", ERROR_CODE_INVALID_ARGUMENTS);
  }

  dbg.info(prefix(__filename), "Binding instance:", {
    name: binding.name,
    token,
    binding,
    options,
    container,
  });

  container.bind<T>({
    token,
    type: "Instance",
    value: binding,
    onActivated: createInstanceActivatedHandler({ binding, container, options }),
    onDeactivated: createInstanceDeactivationHandler({ binding, container, options }),
  });
}

/**
 * Binds a {@link Binding} into a container.
 *
 * @remarks
 * `bind` is the single registration entry point behind `createContainer({ bindings })`.
 * Pass a class constructor directly, or pass a descriptor when the binding needs a
 * custom token, static value, or factory.
 *
 * Descriptors without `type` are treated as `Value` bindings.
 *
 * - Class constructor: singleton instance binding.
 * - `Value`: static value binding.
 * - `Instance`: singleton instance behind a custom token.
 * - `Factory`: factory-backed value binding with optional scope.
 *
 * @group Bind
 *
 * @template T - Bound object type.
 *
 * @param container - Container to bind into.
 * @param binding - Service class or binding descriptor.
 * @param options - Binding options for class bindings.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor has no `token`, has an unknown
 * `type` or `scope`, or is missing fields required by the
 * selected binding strategy.
 *
 * @example
 * ```typescript
 * import { BindingType, Injectable, bind, createContainer } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * @Injectable()
 * class UserService {}
 *
 * const container = createContainer();
 *
 * bind(container, UserService);
 * bind(container, {
 *   token: API_URL,
 *   type: BindingType.Value,
 *   value: "https://api.example.com",
 * });
 * bind(container, {
 *   token: "DATE_NOW",
 *   type: BindingType.Factory,
 *   factory: () => new Date(),
 * });
 * ```
 */
export function bind<T extends object = object>(
  container: Container,
  binding: Binding,
  options: BindOptions = {}
): Container {
  if (typeof binding === "function") {
    bindInstanceDescriptor(container, binding, binding, options);
    registerBinding(container, binding);

    return container;
  }

  validateDescriptor(binding);

  switch (binding.type ?? BindingTypeValues.Value) {
    case BindingTypeValues.Value:
      bindValueDescriptor(container, binding as ValueBindingDescriptor);
      break;

    case BindingTypeValues.Factory:
      bindFactoryDescriptor(container, binding as FactoryBindingDescriptor);
      break;

    case BindingTypeValues.Instance:
      bindInstanceDescriptor(
        container,
        binding.token as Identifier<T>,
        (binding as InstanceBindingDescriptor<T>).value as unknown as Newable<T>,
        options
      );
      break;

    default:
      throw new WirestateError(
        `Binding descriptor has unknown type '${String(binding.type)}'.`,
        ERROR_CODE_INVALID_ARGUMENTS
      );
  }

  registerBinding(container, binding);

  return container;
}
