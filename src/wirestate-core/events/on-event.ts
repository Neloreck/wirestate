import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { appendHandlerMetadata } from "../metadata/handler-metadata";
import { EVENT_HANDLER_METADATA } from "../registry";
import { EventType } from "../types/events";
import { Optional } from "../types/general";

/**
 * Marks a method as an event handler.
 *
 * @remarks
 * The handler registers when the instance activates and unregisters when the
 * instance deactivates.
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
  // Normalize types to a deduplicated array, or null for catch-all.
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? Array.from(new Set(types as ReadonlyArray<EventType>))
        : [types as EventType];

  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnEvent metadata:", {
      name: target.constructor.name,
      types,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    appendHandlerMetadata(EVENT_HANDLER_METADATA, target.constructor, { methodName: propertyKey, types: normalized });
  };
}
