import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, Newable, ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindDynamicValue } from "./bind-dynamic-value";
import { bindService, bindServiceWithToken, type BindServiceOptions } from "./bind-service";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

const SUPPORTED_BINDING_TYPES: ReadonlyArray<string> = [
  BindingType.ConstantValue,
  BindingType.DynamicValue,
  BindingType.Instance,
  // ? -> "Factory" | "ResolvedValue" | "ServiceRedirection";
];

/**
 * Validates descriptor fields needed before {@link bind} dispatches to a concrete binding helper.
 *
 * @group Bind
 * @internal
 *
 * @param binding - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor uses an unsupported binding type or an invalid instance value.
 */
function validateBindDescriptor(binding: BindingDescriptor): void {
  validateBindingDescriptor(binding);

  const bindingType: string = binding.bindingType ?? BindingType.ConstantValue;

  if (!SUPPORTED_BINDING_TYPES.includes(bindingType)) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `Unsupported binding type '${bindingType}'. Supported binding types: ${SUPPORTED_BINDING_TYPES.join(", ")}.`
    );
  }

  if (bindingType === BindingType.Instance && typeof binding.value !== "function") {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Instance descriptor 'value' must be a service constructor."
    );
  }
}

/**
 * Represents options for {@link bind}.
 *
 * @group Bind
 */
export interface BindOptions extends BindServiceOptions {
  /**
   * Skip service lifecycle hooks for class bindings.
   *
   * @default `false`
   */
  readonly isWithIgnoreLifecycle?: boolean;
}

/**
 * Binds a class or descriptor into a container.
 *
 * @remarks
 * `bind` is the router behind `createContainer({ bindings })`.
 *
 * It chooses the right binding helper:
 *
 * - Class constructor: singleton service via {@link bindService}.
 * - `ConstantValue`: fixed value via {@link bindConstant}.
 * - `DynamicValue`: factory value via {@link bindDynamicValue}.
 * - `Instance`: service class behind a custom token.
 *
 * @group Bind
 *
 * @template T - Bound object type.
 *
 * @param container - Container to bind into.
 * @param binding - Service class or descriptor.
 * @param options - Binding options for class bindings.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
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
 *   id: API_URL,
 *   bindingType: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * });
 * ```
 */
export function bind<T extends object = object>(
  container: Container,
  binding: Newable<T> | BindingDescriptor,
  options: BindOptions = {}
): void {
  if (typeof binding === "function") {
    bindService(container, binding, options);

    return;
  }

  validateBindDescriptor(binding);

  if (!binding.bindingType || binding.bindingType === BindingType.ConstantValue) {
    bindConstant(container, binding);

    return;
  }

  if (binding.bindingType === BindingType.DynamicValue) {
    dbg.info(prefix(__filename), "Binding dynamic value descriptor:", {
      binding,
      container,
    });

    bindDynamicValue(container, binding);

    return;
  }

  dbg.info(prefix(__filename), "Binding instance descriptor:", {
    binding,
    container,
  });

  bindServiceWithToken(
    container,
    binding.id as ServiceIdentifier<T>,
    binding.value as unknown as Newable<T>,
    binding,
    options
  );
}
