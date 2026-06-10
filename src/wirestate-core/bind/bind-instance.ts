import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, Newable, Identifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InstanceBindingDescriptor } from "../types/provision";

import { BindOptions } from "./bind";
import { createInstanceActivatedHandler } from "./instance/instance-activated";
import { createInstanceDeactivationHandler } from "./instance/instance-deactivation";
import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that an instance descriptor can be bound by {@link bindInstanceWithToken}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If shared descriptor fields are invalid or
 * the descriptor value is not a constructor.
 */
function validateInstanceDescriptor(descriptor: InstanceBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type === BindingType.Instance && typeof descriptor.value !== "function") {
    throw new WirestateError("Instance descriptor 'value' must be a constructor.", ERROR_CODE_INVALID_ARGUMENTS);
  }
}

/**
 * Binds a constructor as a Wirestate singleton.
 *
 * @remarks
 * Use this for classes that should participate in Wirestate lifecycle.
 *
 * The binding does four jobs:
 *
 * - Resolves one instance per container.
 * - Runs `@OnActivated` and `@OnDeactivation`.
 * - Registers `@OnEvent`, `@OnCommand`, and `@OnQuery` handlers.
 * - Tracks instance lifecycle state for {@link WireStatus}.
 *
 * @group Bind
 *
 * @template T - Instance type.
 *
 * @param container - Container to bind into.
 * @param binding - Instance class.
 * @param options - Binding options.
 * @returns The same container for chaining or immediate resolution.
 *
 * @example
 * ```typescript
 * import { Injectable, OnCommand, bind, createContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class SessionService {
 *   private active = false;
 *
 *   @OnCommand("LOGIN")
 *   public login(): void {
 *     this.active = true;
 *   }
 *
 *   public isActive(): boolean {
 *     return this.active;
 *   }
 * }
 *
 * const container = createContainer();
 *
 * bind(container, SessionService);
 *
 * const service = container.get(SessionService);
 * ```
 */
export function bindInstance<T extends object>(
  container: Container,
  binding: Newable<T>,
  options?: BindOptions
): Container {
  return bindInstanceWithToken(container, binding, binding, binding, options);
}

/**
 * Binds a constructor behind a custom token while preserving Wirestate lifecycle wiring.
 *
 * @group Bind
 * @internal
 *
 * @template T - Type of the instance.
 *
 * @param container - Target {@link Container}.
 * @param token - Token used to resolve the binding.
 * @param binding - Class constructor.
 * @param registeredBinding - Binding recorded as container-owned.
 * @param options - Configuration options for the binding.
 * @returns The same container for chaining or immediate resolution.
 */
export function bindInstanceWithToken<T extends object>(
  container: Container,
  token: Identifier<T>,
  binding: Newable<T>,
  registeredBinding: Newable<T> | InstanceBindingDescriptor<T>,
  options?: BindOptions
): Container {
  if (typeof registeredBinding !== "function") {
    validateInstanceDescriptor(registeredBinding);
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

  registerBinding(container, registeredBinding);

  return container;
}
