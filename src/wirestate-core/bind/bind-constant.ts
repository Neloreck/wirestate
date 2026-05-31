import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, BindingScope, ServiceIdentifier } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { ConstantValueBindingDescriptor } from "../types/provision";

import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindConstant}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-constant type,
 * uses a non-singleton scope, or omits the `value` field.
 */
function validateConstantDescriptor(descriptor: ConstantValueBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== undefined && descriptor.type !== BindingType.ConstantValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindConstant expected type '${BindingType.ConstantValue}'.`
    );
  }

  if (descriptor.scope && descriptor.scope !== BindingScope.Singleton) {
    throw new WirestateError(ERROR_CODE_BINDING_SCOPE, "Provided unexpected binding scope for constant value.");
  }

  if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Constant value descriptor must provide a 'value' property."
    );
  }
}

/**
 * Binds a fixed value to a token.
 *
 * @remarks
 * Use constants for config, adapters, and test doubles. The same value comes
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
export function bindConstant<T>(container: Container, descriptor: ConstantValueBindingDescriptor<T>): Container {
  validateConstantDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding constant:", {
    token: descriptor.token,
    value: descriptor.value,
    descriptor,
    container,
  });

  container.bind<T>(descriptor.token as ServiceIdentifier<T>).toConstantValue(descriptor.value as T);

  registerBinding(container, descriptor);

  return container;
}
