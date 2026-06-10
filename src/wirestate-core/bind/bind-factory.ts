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
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-factory type,
 * omits `factory`, or provides a non-function `factory`.
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
 * Binds a factory-backed value to a token.
 *
 * @remarks
 * The factory runs inside the injection context, so `inject()` works in its body
 * to resolve dependencies. With the default `Singleton` scope the factory runs once
 * and its value is cached; with `Transient` scope it runs on every resolution.
 *
 * @group Bind
 *
 * @template T - Value type.
 *
 * @param container - Container to bind into.
 * @param descriptor - Descriptor with `token`, `factory`, and optional scope.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 *
 * @internal
 */
export function bindFactory<T>(container: Container, descriptor: FactoryBindingDescriptor<T>): Container {
  validateFactoryDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding factory:", {
    descriptor,
    container,
  });

  container.bind({
    token: descriptor.token,
    type: "Factory",
    scope: descriptor.scope,
    factory: (current) => descriptor.factory(current),
  });

  registerBinding(container, descriptor);

  return container;
}
