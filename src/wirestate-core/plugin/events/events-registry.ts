import { collectHandlerMetadata } from "../../metadata/metadata-handlers";

import type { EventHandlerMetadata } from "./events";

/**
 * Registry of class constructors to their declared event handlers.
 *
 * @remarks
 * Populated by the {@link OnEvent} decorator in legacy experimental mode.
 *
 * @group Events
 * @internal
 */
export const EVENT_HANDLER_METADATA: WeakMap<object, Array<EventHandlerMetadata>> = new WeakMap();

/**
 * Standard decorator metadata key for event handlers declared with {@link OnEvent}.
 *
 * @remarks
 * TC39 standard decorators store an `Array<EventHandlerMetadata>` under this
 * key on the class `Symbol.metadata` object.
 *
 * @group Events
 * @internal
 */
export const EVENT_METADATA_KEY: symbol = Symbol.for("@wirestate/core/metadata/event");

/**
 * Retrieves `@OnEvent` metadata from the class hierarchy.
 *
 * @remarks
 * Traverses the prototype chain to collect all event handlers, ordered from base
 * class to derived class to ensure parent-first execution.
 *
 * @group Events
 * @internal
 *
 * @param instance - The instance to scan for event handlers.
 * @returns A read-only array of event handler metadata, ordered from base to derived class.
 */
export function getEventHandlerMetadata(instance: object): ReadonlyArray<EventHandlerMetadata> {
  return collectHandlerMetadata(instance, EVENT_HANDLER_METADATA, EVENT_METADATA_KEY);
}
