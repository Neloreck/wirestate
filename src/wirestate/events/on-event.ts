import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "@/wirestate/registry";
import type { IEventHandlerMetadata, TEventType } from "@/wirestate/types/events";
import type { Maybe, Optional } from "@/wirestate/types/general";

/**
 * Decorator for service methods that respond to events.
 *
 * @param types - event type(s) to handle. If omitted, handles all events
 * @returns decorator function
 */
export function OnEvent(types?: TEventType | ReadonlyArray<TEventType>): MethodDecorator {
  // Normalize types to an array or null for catch-all.
  const normalized: Optional<ReadonlyArray<TEventType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? [...(types as ReadonlyArray<TEventType>)]
        : [types as TEventType];

  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnEvent metadata:", {
      name: target.constructor.name,
      types,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<IEventHandlerMetadata>> = EVENT_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      EVENT_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, types: normalized });
  };
}
