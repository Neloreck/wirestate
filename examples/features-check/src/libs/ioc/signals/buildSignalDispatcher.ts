import { AbstractService } from "../service/AbstractService";
import { getSignalHandlerMetadata } from "../signals/getSignalHandlerMetadata";
import type { ISignalDispatchEntry, TSignalHandler } from "../types/signals";

/**
 * Composes service signal handlers into a single dispatcher.
 *
 * @internal Used by container activation.
 * @param instance - service instance
 * @returns signal handler or null if no handlers are declared
 */
export function buildSignalDispatcher(
  instance: AbstractService,
): TSignalHandler | null {
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
    const method = (instance as unknown as Record<string | symbol, unknown>)[
      meta.methodName
    ];

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

  return (signal) => {
    // Fan out signals to all matching handlers.
    for (const entry of entries) {
      if (entry.types === null || entry.types.includes(signal.type)) {
        entry.handler(signal);
      }
    }
  };
}
