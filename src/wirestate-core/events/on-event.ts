import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "../registry";
import type { EventHandlerMetadata, EventType } from "../types/events";
import type { Maybe, Optional } from "../types/general";

/**
 * Decorator for service methods that respond to events.
 *
 * @group events
 *
 * @param types - event type(s) to handle. If omitted, handles all events
 * @returns decorator function
 */
export function OnEvent(types?: EventType | ReadonlyArray<EventType>): MethodDecorator {
  // Normalize types to an array or null for catch-all.
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnEvent metadata:", {
      name: target.constructor.name,
      types,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<EventHandlerMetadata>> = EVENT_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      EVENT_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, types: normalized });
  };
}
