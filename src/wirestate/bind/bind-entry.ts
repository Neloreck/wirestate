import { bindingTypeValues, Container, Newable } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { bindConstant } from "@/wirestate/bind/bind-constant";
import { bindDynamicValue } from "@/wirestate/bind/bind-dynamic-value";
import { bindService, type IBindServiceOptions } from "@/wirestate/bind/bind-service";
import type { IInjectableDescriptor } from "@/wirestate/types/privision";

/**
 * Options for {@link bindEntry}.
 */
export interface IBindEntryOptions extends IBindServiceOptions {
  isWithIgnoreLifecycle?: boolean;
}

/**
 * Binds a single service entry to the container, dispatching to the
 * correct binding strategy based on the descriptor's `type` field.
 *
 * Supports:
 * - Service classes (function entries) - bound as singleton
 * - Constant values - bound via `bindConstant`
 * - Dynamic values - bound via `toDynamicValue` with optional scope
 * - Instance bindings - bound as generic singleton service
 *
 * @param container - target IOC container to bind into
 * @param entry - entry descriptor to bind
 * @param options - optional binding configuration
 * @returns void
 */
export function bindEntry<T extends object = object>(
  container: Container,
  entry: Newable<T> | IInjectableDescriptor,
  options: IBindEntryOptions = {}
): void {
  if (typeof entry === "function") {
    return bindService(container, entry, options);
  }

  if (!entry.bindingType || entry.bindingType === bindingTypeValues.ConstantValue) {
    return bindConstant(container, entry);
  }

  if (entry.bindingType === bindingTypeValues.DynamicValue) {
    dbg.info(prefix(__filename), "Binding dynamic value entry:", {
      entry,
      container,
    });

    return bindDynamicValue(container, entry);
  }

  dbg.info(prefix(__filename), "Binding entry with fallback:", {
    entry,
    container,
  });

  // Default: treat as class descriptor (Instance binding).
  return bindService(container, entry.value as unknown as Newable<T>, options);
}
