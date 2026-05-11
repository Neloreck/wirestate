import { Optional } from "./general";

/**
 * Represents an Event identifier.
 *
 * @group Events
 */
export type EventType = string | symbol;

/**
 * Represents an event object.
 *
 * @group Events
 */
export interface Event<P = unknown, T extends EventType = EventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Represents event handler signature.
 *
 * @group Events
 */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Represents event bus unsubscribing function, part of events subscription lifecycle.
 *
 * @group Events
 */
export type EventUnsubscriber = () => void;

/**
 * Represents internal dispatch entry.
 *
 * @group Events
 * @internal
 */
export interface EventDispatchEntry {
  readonly types: Optional<ReadonlyArray<Event["type"]>>;
  readonly handler: EventHandler;
}

/**
 * Represents metadata for OnEvent decorated methods.
 *
 * @group Events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<EventType>>;
}
