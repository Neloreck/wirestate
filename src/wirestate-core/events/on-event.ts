import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "../registry";
import { EventHandlerMetadata, EventType } from "../types/events";
import { Maybe, Optional } from "../types/general";

/**
 * Marks a service method as an event handler.
 *
 * @remarks
 * The handler registers when the service activates and unregisters when the
 * service deactivates.
 *
 * Omit `types` to receive every event in the container.
 *
 * @group Events
 *
 * @param types - Event token or tokens. Omit for all events.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnEvent, WireEvent } from "@wirestate/core";
 *
 * @Injectable()
 * class MyService {
 *   @OnEvent("USER_LOGGED_IN")
 *   private onLogin(event: WireEvent<User>): void {
 *     console.log(event.payload.id);
 *   }
 * }
 * ```
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
