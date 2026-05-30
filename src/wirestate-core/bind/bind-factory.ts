import type { Factory, ResolutionContext } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { FactoryBindingDescriptor } from "../types/provision";

import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

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
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, `bindFactory expected type '${BindingType.Factory}'.`);
  }

  if (typeof descriptor.factory !== "function") {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Factory descriptor 'factory' must be a function.");
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

  container
    .bind(descriptor.token as ServiceIdentifier<Factory<unknown>>)
    .toFactory(descriptor.factory as (context: ResolutionContext) => Factory<unknown> | Promise<Factory<unknown>>);

  registerBinding(container, descriptor);

  return container;
}
