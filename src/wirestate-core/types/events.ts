import { Optional } from "./general";

/**
 * Represents an Event identifier.
 *
 * @group events
 */
export type EventType = string | symbol;

/**
 * Represents an event object.
 *
 * @group events
 */
export interface Event<P = unknown, T extends EventType = EventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Represents event handler signature.
 *
 * @group events
 */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Represents event bus unsubscribing function, part of events subscription lifecycle.
 *
 * @group events
 */
export type EventUnsubscriber = () => void;

/**
 * Represents internal dispatch entry.
 *
 * @group events
 * @internal
 */
export interface EventDispatchEntry {
  readonly types: Optional<ReadonlyArray<Event["type"]>>;
  readonly handler: EventHandler;
}

/**
 * Represents metadata for OnEvent decorated methods.
 *
 * @group events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<EventType>>;
}
