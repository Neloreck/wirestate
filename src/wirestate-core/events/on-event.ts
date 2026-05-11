import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_HANDLER_METADATA } from "../registry";
import type { EventHandlerMetadata, EventType } from "../types/events";
import type { Maybe, Optional } from "../types/general";

/**
 * Decorator for service methods that respond to events.
 *
 * @remarks
 * Methods decorated with `@OnEvent` are automatically registered as subscribers
 * when the service is bound via {@link bindService}.
 *
 * You can specify one or more event types to handle. If `types` is omitted,
 * the method acts as a catch-all handler for all events broadcasted to the {@link EventBus}.
 *
 * @group events
 *
 * @param types - Event identifier(s) to handle. If omitted, handles all events.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * class MyService {
 *   @OnEvent("USER_LOGGED_IN")
 *   private onLogin(event: Event<User>): void {
 *     console.log("User logged in:", event);
 *   }
 *
 *   @OnEvent(["LOGOUT", "SESSION_EXPIRED"])
 *   private onSessionEnd(event: Event): void {
 *     console.log("Specific event received:", event);
 *   }
 *
 *   @OnEvent()
 *   private onAnyEvent(event: Event): void {
 *     // Catch-all handler
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
