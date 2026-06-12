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
