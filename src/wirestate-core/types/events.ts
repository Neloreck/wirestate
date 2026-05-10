import { Optional } from "./general";

/**
 * Event identifier.
 *
 * @group events
 */
export type EventType = string | symbol;

/**
 * Event object.
 *
 * @group events
 */
export interface Event<P = unknown, T extends EventType = EventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Event handler signature.
 *
 * @group events
 */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Unsubscribes from events, part of events subscription lifecycle.
 *
 * @group events
 */
export type EventUnsubscriber = () => void;

/**
 * Internal dispatch entry.
 *
 * @group events
 * @internal
 */
export interface EventDispatchEntry {
  readonly types: Optional<ReadonlyArray<Event["type"]>>;
  readonly handler: EventHandler;
}

/**
 * Metadata for OnEvent decorated methods.
 *
 * @group events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<EventType>>;
}
