import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import type { EventDispatchEntry, EventHandler } from "../types/events";
import type { Optional } from "../types/general";

import { getEventHandlerMetadata } from "./get-event-handler-metadata";

/**
 * Composes service event handlers into a single dispatcher.
 *
 * @group events
 * @internal
 *
 * @param instance - Service instance.
 * @returns Event handler or null if no handlers are declared.
 */
export function buildEventDispatcher<T extends object>(instance: T): Optional<EventHandler> {
  dbg.info(prefix(__filename), "Build event dispatcher for:", { name: instance.constructor.name, instance });

  const entries: Array<EventDispatchEntry> = [];

  // Register methods decorated with @OnEvent.
  for (const meta of getEventHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method === "function") {
      entries.push({
        types: meta.types,
        handler: (method as EventHandler).bind(instance),
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
