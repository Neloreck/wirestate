import { BindInWhenOnFluentSyntax, DynamicValueBuilder } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { DynamicValueBindingDescriptor } from "../types/provision";

import { applyBindingScope } from "./utils/apply-binding-scope";
import { registerBinding } from "./utils/register-binding";
import { validateBindingDescriptor } from "./utils/validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindDynamicValue}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-dynamic type,
 * omits `factory`, or provides a non-function `factory`.
 */
function validateDynamicValueDescriptor(descriptor: DynamicValueBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type !== undefined && descriptor.type !== BindingType.DynamicValue) {
    throw new WirestateError(
      `bindDynamicValue expected type '${BindingType.DynamicValue}'.`,
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }

  if (typeof descriptor.factory !== "function") {
    throw new WirestateError("Dynamic value descriptor 'factory' must be a function.", ERROR_CODE_INVALID_ARGUMENTS);
  }
}

/**
 * Binds a factory-backed value to a token.
 *
 * @remarks
 * Use this when the value depends on resolution time. A dynamic value is a
 * vending machine: each resolution can ask the factory for a fresh item, unless
 * you choose singleton scope.
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
export function bindDynamicValue<T>(container: Container, descriptor: DynamicValueBindingDescriptor<T>): Container {
  validateDynamicValueDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding dynamic value:", {
    descriptor,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<T> = container
    .bind(descriptor.token)
    .toDynamicValue((context) =>
      (descriptor.factory as DynamicValueBuilder<T>)(context)
    ) as BindInWhenOnFluentSyntax<T>;

  applyBindingScope(binding, descriptor.scope);

  registerBinding(container, descriptor);

  return container;
}
