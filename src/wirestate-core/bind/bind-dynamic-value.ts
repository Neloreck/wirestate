import type { BindInWhenOnFluentSyntax } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { BindingDescriptor } from "../types/provision";

import { applyBindingScope } from "./apply-binding-scope";
import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindDynamicValue}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-dynamic binding type,
 * omits both `factory` and `value`, or provides a non-function `factory`.
 */
function validateDynamicValueDescriptor(descriptor: BindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.bindingType !== undefined && descriptor.bindingType !== BindingType.DynamicValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindDynamicValue expected binding type '${BindingType.DynamicValue}'.`
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(descriptor, "factory") &&
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Dynamic value descriptor must provide either a 'factory' or 'value' property."
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(descriptor, "factory") &&
    descriptor.factory !== undefined &&
    typeof descriptor.factory !== "function"
  ) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Dynamic value descriptor 'factory' must be a function.");
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
 * @param descriptor - Descriptor with `id`, `factory` or `value`, and optional scope.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor is invalid.
 *
 * @example
 * ```typescript
 * import { BindingType, ScopeBindingType, bindDynamicValue, createContainer } from "@wirestate/core";
 *
 * const DATE_NOW = Symbol("DATE_NOW");
 * const container = createContainer();
 *
 * bindDynamicValue(container, {
 *   id: DATE_NOW,
 *   bindingType: BindingType.DynamicValue,
 *   scopeBindingType: ScopeBindingType.Transient,
 *   factory: () => new Date(),
 * });
 *
 * const now = container.get<Date>(DATE_NOW);
 * ```
 */
export function bindDynamicValue<T>(container: Container, descriptor: BindingDescriptor): Container {
  validateDynamicValueDescriptor(descriptor);

  dbg.info(prefix(__filename), "Binding dynamic value:", {
    descriptor,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<T> = container.bind(descriptor.id).toDynamicValue(() => {
    if (Object.prototype.hasOwnProperty.call(descriptor, "factory") && descriptor.factory) {
      return (descriptor.factory as () => T)();
    }

    return descriptor.value;
  }) as BindInWhenOnFluentSyntax<T>;

  registerBinding(container, descriptor);
  applyBindingScope(binding, descriptor.scopeBindingType);

  return container;
}
