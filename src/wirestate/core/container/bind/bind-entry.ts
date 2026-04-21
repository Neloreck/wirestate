import { bindingTypeValues, Container, Newable } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AbstractService } from "@/wirestate";
import { bindConstant } from "@/wirestate/core/container/bind/bind-constant";
import { bindDynamicValue } from "@/wirestate/core/container/bind/bind-dynamic-value";
import { bindService } from "@/wirestate/core/container/bind/bind-service";
import type { IInjectableDescriptor } from "@/wirestate/types/privision";
import type { TServiceClass } from "@/wirestate/types/services";

/**
 * Binds a single service entry to the container, dispatching to the
 * correct binding strategy based on the descriptor's `type` field.
 *
 * Supports:
 * - Service classes (function entries) - bound as singleton AbstractService
 * - Constant values - bound via `bindConstant`
 * - Dynamic values - bound via `toDynamicValue` with optional scope
 * - Instance bindings - bound as AbstractService with optional scope
 *
 * @param container - target IOC container to bind into
 * @param entry - entry descriptor to bind
 */
export function bindEntry(container: Container, entry: TServiceClass | IInjectableDescriptor): void {
  if (typeof entry === "function") {
    bindService(container, entry);

    return;
  }

  if (!entry.type || entry.type === bindingTypeValues.ConstantValue) {
    bindConstant(container, entry);

    return;
  }

  if (entry.type === bindingTypeValues.DynamicValue) {
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

  // Default: treat as an AbstractService descriptor (Instance binding).
  bindService(container, entry as unknown as Newable<AbstractService>);
}
