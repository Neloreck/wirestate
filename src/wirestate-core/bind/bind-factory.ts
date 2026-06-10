import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { FactoryBindingDescriptor } from "../types/provision";

import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindFactory}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
function validateFactoryDescriptor(descriptor: FactoryBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== BindingType.Factory) {
    throw new WirestateError(`bindFactory expected type '${BindingType.Factory}'.`, ERROR_CODE_INVALID_ARGUMENTS);
  }

  if (typeof descriptor.factory !== "function") {
    throw new WirestateError("Factory descriptor 'factory' must be a function.", ERROR_CODE_INVALID_ARGUMENTS);
  }
}

/**
 * Binds a factory creator to a token.
 *
 * @group Bind
 *
 * @template T - Factory function type.
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token`, `type`, and `factory`.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 */
export function bindFactory(container: Container, descriptor: FactoryBindingDescriptor): Container {
  validateFactoryDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding factory descriptor:", {
    descriptor,
    container,
  });

  container.bind({
    provide: descriptor.token,
    useFactory: (current) => descriptor.factory(current),
  });

  registerBinding(container, descriptor);

  return container;
}
