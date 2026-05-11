import { bindingScopeValues, BindInWhenOnFluentSyntax, BindWhenOnFluentSyntax, Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { InjectableDescriptor } from "../types/privision";

/**
 * Binds a dynamic value (factory-based) to an identifier in the container.
 *
 * @remarks
 * Use this when the value depends on runtime state or requires logic during resolution.
 * The binding uses `entry.factory` if provided; otherwise, it falls back to `entry.value`.
 * Supports custom scoping via `entry.scopeBindingType`.
 *
 * @group bind
 *
 * @template T - Type of the value being bound.
 *
 * @param container - Target Inversify container.
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
  dbg.info(prefix(__filename), "Binding constant:", {
    entry,
    container,
  });

  const binding: BindInWhenOnFluentSyntax<T> = container.bind(entry.id).toDynamicValue(() => {
    if (entry.factory) {
      return entry.factory();
    }

    return entry.value;
  }) as BindInWhenOnFluentSyntax<T>;

  if (!entry.scopeBindingType) {
    return binding;
  } else if (entry.scopeBindingType === bindingScopeValues.Transient) {
    return binding.inTransientScope();
  } else if (entry.scopeBindingType === bindingScopeValues.Request) {
    return binding.inRequestScope();
  } else {
    return binding.inSingletonScope();
  }
}
