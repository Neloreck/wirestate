import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { getEventHandlerMetadata } from "@/wirestate/core/events/get-event-handler-metadata";
import type { IEventDispatchEntry, TEventHandler } from "@/wirestate/types/events";
import type { Optional } from "@/wirestate/types/general";

/**
 * Composes service event handlers into a single dispatcher.
 *
 * @param instance - service instance
 * @returns event handler or null if no handlers are declared
 * @internal
 */
export function buildEventDispatcher<T extends object>(instance: T): Optional<TEventHandler> {
  dbg.info(prefix(__filename), "Build event dispatcher for:", { name: instance.constructor.name, instance });

  const entries: Array<IEventDispatchEntry> = [];

  // Register methods decorated with @OnEvent.
  for (const meta of getEventHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method === "function") {
      entries.push({
        types: meta.types,
        handler: (method as TEventHandler).bind(instance),
      });
    }
  }

  if (entries.length) {
    dbg.info(prefix(__filename), "Built event dispatcher for:", {
      name: instance.constructor.name,
      instance,
      entries,
    });

    return (event) => {
      // Fan out events to all matching handlers.
      for (const entry of entries) {
        if (entry.types === null || entry.types.includes(event.type)) {
          entry.handler(event);
        }
      }
    };
  } else {
    dbg.info(prefix(__filename), "Skip building event dispatcher for:", {
      name: instance.constructor.name,
      instance,
      entries,
    });

    return null;
  }
}
