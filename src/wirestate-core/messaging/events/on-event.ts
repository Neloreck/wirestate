import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { validateStandardMethodContext } from "../../metadata/metadata-decorator-context";
import {
  appendHandlerMetadata,
  appendStandardHandlerMetadata,
  collectHandlerMetadata,
} from "../../metadata/metadata-handlers";
import type { Optional } from "../../types/general";

import type { EventHandlerMetadata, EventType, WireEvent } from "./events";
import { EVENT_HANDLER_METADATA, EVENT_METADATA_KEY } from "./events-registry";

/**
 * Describes the decorator returned by {@link OnEvent}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Events
 */
export interface OnEventHandlerDecorator<E extends WireEvent = WireEvent> {
  // Standard (TC39):
  <This>(value: (this: This, event: E) => void, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

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
 * @template E - Event type received by the decorated method.
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
export function OnEvent<E extends WireEvent = WireEvent>(
  types?: EventType | ReadonlyArray<EventType>
): OnEventHandlerDecorator<E> {
  // Normalize types to a deduplicated array, or null for catch-all.
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? Array.from(new Set(types as ReadonlyArray<EventType>))
        : [types as EventType];

  return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      const metadata: DecoratorMetadataObject = validateStandardMethodContext("OnEvent", nameOrContext);

      dbg.info(prefix(__filename), "Attaching OnEvent metadata (TC39):", {
        types,
        propertyKey: nameOrContext.name,
        context: nameOrContext,
      });

      appendStandardHandlerMetadata(metadata, EVENT_METADATA_KEY, {
        methodName: nameOrContext.name,
        types: normalized,
      });
    } else {
      // Experimental legacy decorators:
      dbg.info(prefix(__filename), "Attaching OnEvent metadata:", {
        name: target.constructor.name,
        types,
        propertyKey: nameOrContext,
        target,
        constructor: target.constructor,
      });

      appendHandlerMetadata(EVENT_HANDLER_METADATA, target.constructor, {
        methodName: nameOrContext,
        types: normalized,
      });
    }
  }) as OnEventHandlerDecorator<E>;
}

/**
 * Retrieves `@OnEvent` metadata from the class hierarchy.
 *
 * @remarks
 * Traverses the prototype chain to collect all event handlers.
 * Returns metadata ordered from base class to derived class to ensure parent-first execution.
 *
 * @group Events
 * @internal
 *
 * @param instance - The instance to scan for event handlers.
 * @returns A read-only array of event handler metadata, ordered from base to derived class.
 */
export function getEventHandlerMetadata(instance: object): ReadonlyArray<EventHandlerMetadata> {
  dbg.info(prefix(__filename), "Retrieving event handler metadata:", { name: instance.constructor.name, instance });

  return collectHandlerMetadata(instance, EVENT_HANDLER_METADATA, EVENT_METADATA_KEY);
}
