import { bindingTypeValues, Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { bindConstant } from "@/wirestate/core/container/bind/bind-constant";
import { bindService } from "@/wirestate/core/container/bind/bind-service";
import type { IInjectableDescriptor } from "@/wirestate/types/privision";
import type { TServiceClass } from "@/wirestate/types/services";

/**
 * Binds a single service entry to the container, dispatching to the
 * correct binding strategy based on the descriptor's `type` field.
 *
 * @param container - target IOC container to bind into
 * @param entry - entry descriptor to bind
 * @param isWithBindingCheck - whether to perform binding checks
 */
export function bindEntry(
  container: Container,
  entry: TServiceClass | IInjectableDescriptor,
  isWithBindingCheck?: boolean
): void {
  if (typeof entry === "function") {
    bindService(container, entry, entry, { isWithBindingCheck });

    return;
  }

  if (!entry.type || entry.type === bindingTypeValues.ConstantValue) {
    bindConstant(container, entry.id, entry.value, { isWithBindingCheck });

    return;
  }

  dbg.info(prefix(__filename), "Binding entry with fallback:", {
    entry,
    container,
  });

  // Default: treat as an AbstractService descriptor (Instance binding).
  // todo: Probably instantly throw with UNSUPPORTED error.
  bindService(container, entry.id as any, entry.value as TServiceClass, { isWithBindingCheck });
}
