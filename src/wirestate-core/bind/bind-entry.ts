import { bindingTypeValues, Container, Newable } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { InjectableDescriptor } from "../types/privision";

import { bindConstant } from "./bind-constant";
import { bindDynamicValue } from "./bind-dynamic-value";
import { bindService, type BindServiceOptions } from "./bind-service";

/**
 * Represents options for {@link bindEntry}.
 *
 * @group Bind
 */
export interface BindEntryOptions extends BindServiceOptions {
  /**
   * If true, the service's lifecycle methods (like `@OnActivated`) will be ignored
   * during the binding process.
   *
   * @default `false`
   */
  isWithIgnoreLifecycle?: boolean;
}

/**
 * Binds an entry to the Inversify {@link Container} using the appropriate strategy.
 *
 * @remarks
 * This is a high-level dispatching function that selects the binding method based on the `entry` type:
 * - **Class Constructor**: Binds as a singleton service via {@link bindService}.
 * - **ConstantValue**: Binds a fixed value via {@link bindConstant}.
 * - **DynamicValue**: Binds a factory-generated value via {@link bindDynamicValue}.
 * - **Instance**: Binds a value as a class instance via {@link bindService}.
 *
 * @group Bind
 *
 * @template T - Type of the object being bound.
 *
 * @param container - Target Inversify {@link Container}.
 * @param entry - Class constructor or {@link InjectableDescriptor} describing the service.
 * @param options - Optional binding configuration (primarily used for class-based services).
 *
 * @throws {@link WirestateError} If `entry.scopeBindingType` is not `Singleton` for constant values.
 *
 * @example
 * ```typescript
 * // Binding a class constructor (defaults to singleton)
 * class MyService {}
 *
 * bindEntry(container, MyService);
 *
 * // Binding a constant value
 * const API_URL: unique symbol = Symbol("API_URL");
 *
 * bindEntry(container, {
 *   id: API_URL,
 *   value: "https://api.example.com"
 * });
 *
 * // Binding a dynamic value (factory)
 * const CURRENT_TIME: unique symbol = Symbol("CURRENT_TIME");
 *
 * bindEntry(container, {
 *   id: CURRENT_TIME,
 *   bindingType: "DynamicValue",
 *   factory: () => new Date()
 * });
 * ```
 */
export function bindEntry<T extends object = object>(
  container: Container,
  entry: Newable<T> | InjectableDescriptor,
  options: BindEntryOptions = {}
): void {
  if (typeof entry === "function") {
    bindService(container, entry, options);

    return;
  }

  if (!entry.bindingType || entry.bindingType === bindingTypeValues.ConstantValue) {
    bindConstant(container, entry);

    return;
  }

  if (entry.bindingType === bindingTypeValues.DynamicValue) {
    dbg.info(prefix(__filename), "Binding dynamic value entry:", {
      entry,
      container,
    });

    bindDynamicValue(container, entry);

    return;
  }

  dbg.info(prefix(__filename), "Binding entry with fallback:", {
    entry,
    container,
  });

  // Default: treat as class descriptor (Instance binding).
  bindService(container, entry.value as unknown as Newable<T>, options);
}
