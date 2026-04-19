import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { getSignalHandlerMetadata } from "@/wirestate/core/signals/get-signal-handler-metadata";
import type { Optional } from "@/wirestate/types/general";
import type { ISignalDispatchEntry, TSignalHandler } from "@/wirestate/types/signals";

/**
 * Composes service signal handlers into a single dispatcher.
 *
 * @param instance - service instance
 * @returns signal handler or null if no handlers are declared
 * @internal
 */
export function buildSignalDispatcher(instance: AbstractService): Optional<TSignalHandler> {
  dbg.info(prefix(__filename), "Build signal dispatcher for:", { name: instance.constructor.name, instance });

  const entries: Array<ISignalDispatchEntry> = [];

  // Register catch-all hook if present.
  if (typeof instance.onSignal === "function") {
    entries.push({
      types: null,
      handler: (signal) => instance.onSignal?.(signal),
    });
  }

  // Register methods decorated with @OnSignal.
  for (const meta of getSignalHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method !== "function") {
      continue;
    }

    entries.push({
      types: meta.types,
      handler: (method as TSignalHandler).bind(instance),
    });
  }

  if (entries.length === 0) {
    return null;
  }

  dbg.info(prefix(__filename), "Built signal dispatcher for:", {
    name: instance.constructor.name,
    instance,
    entries,
  });

  return (signal) => {
    // Fan out signals to all matching handlers.
    for (const entry of entries) {
      if (entry.types === null || entry.types.includes(signal.type)) {
        entry.handler(signal);
      }
    }
  };
}
