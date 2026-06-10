import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, BindingScope, Container, Identifier } from "../alias";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ValueBindingDescriptor } from "../types/provision";

import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindValue}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-value type,
 * uses a non-singleton scope, or omits the `value` field.
 */
function validateValueDescriptor(descriptor: ValueBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== undefined && descriptor.type !== BindingType.Value) {
    throw new WirestateError(`bindValue expected type '${BindingType.Value}'.`, ERROR_CODE_INVALID_ARGUMENTS);
  }

  if (descriptor.scope && descriptor.scope !== BindingScope.Singleton) {
    throw new WirestateError("Provided unexpected binding scope for value.", ERROR_CODE_INVALID_BINDING_SCOPE);
  }

  if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) {
    throw new WirestateError("Value descriptor must provide a 'value' property.", ERROR_CODE_INVALID_ARGUMENTS);
  }
}

/**
 * Binds a static value to a token.
 *
 * @remarks
 * Use values for config, adapters, and test doubles. The same value comes
 * back every time. No constructor runs.
 *
 * @group Bind
 *
 * @template T - Value type.
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token` and `value`.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If `descriptor.scope` is not `Singleton`.
 *
 * @internal
 */
export function bindValue<T>(container: Container, descriptor: ValueBindingDescriptor<T>): Container {
  validateValueDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding value:", {
    token: descriptor.token,
    value: descriptor.value,
    descriptor,
    container,
  });

  container.bind({ token: descriptor.token as Identifier<T>, value: descriptor.value as T });

  registerBinding(container, descriptor);

  return container;
}
