import { BindInWhenOnFluentSyntax, BindWhenOnFluentSyntax, Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ScopeBindingType, BindingType } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { InjectableDescriptor } from "../types/provision";

import { registerContainerEntry } from "./bind-register";
import { validateInjectableDescriptor } from "./validate-injectable-descriptor";

/**
 * Validates that a descriptor can be bound by {@link bindDynamicValue}.
 *
 * @group Bind
 * @internal
 *
 * @param entry - Descriptor to validate.
 *
 * @throws {@link WirestateError} If the descriptor is missing a token, uses a non-dynamic binding type,
 * omits both `factory` and `value`, or provides a non-function `factory`.
 */
function validateDynamicValueDescriptor(entry: InjectableDescriptor): void {
  validateInjectableDescriptor(entry);

  if (entry.bindingType !== undefined && entry.bindingType !== BindingType.DynamicValue) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      `bindDynamicValue expected binding type '${BindingType.DynamicValue}'.`
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(entry, "factory") &&
    !Object.prototype.hasOwnProperty.call(entry, "value")
  ) {
    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "Dynamic value descriptor must provide either a 'factory' or 'value' property."
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(entry, "factory") &&
    entry.factory !== undefined &&
    typeof entry.factory !== "function"
  ) {
    throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Dynamic value descriptor 'factory' must be a function.");
  }
}

/**
 * Binds a dynamic value (factory-based) to an identifier in the container.
 *
 * @remarks
 * Use this when the value depends on runtime state or requires logic during resolution.
 * The binding uses `entry.factory` if provided; otherwise, it falls back to `entry.value`.
 * Supports custom scoping via `entry.scopeBindingType`.
 *
 * @group Bind
 *
 * @template T - Type of the value being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Descriptor containing `id`, `factory` or `value`, and optional `scopeBindingType`.
 * @returns Inversify fluent syntax for additional constraints.
 *
 * @example
 * ```typescript
 * const DATE_NOW: unique symbol = Symbol("DATE_NOW");
 *
 * bindDynamicValue(container, {
 *   id: DATE_NOW,
 *   factory: () => new Date()
 * });
 * ```
 */
export function bindDynamicValue<T>(container: Container, entry: InjectableDescriptor): BindWhenOnFluentSyntax<T> {
  validateDynamicValueDescriptor(entry);

  dbg.info(prefix(__filename), "Binding constant:", {
    entry,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<T> = container.bind(entry.id).toDynamicValue(() => {
    if (Object.prototype.hasOwnProperty.call(entry, "factory") && entry.factory) {
      return entry.factory();
    }

    return entry.value;
  }) as BindInWhenOnFluentSyntax<T>;

  registerContainerEntry(container, entry);

  if (!entry.scopeBindingType) {
    return binding;
  } else if (entry.scopeBindingType === ScopeBindingType.Transient) {
    return binding.inTransientScope();
  } else if (entry.scopeBindingType === ScopeBindingType.Request) {
    return binding.inRequestScope();
  } else {
    return binding.inSingletonScope();
  }
}
