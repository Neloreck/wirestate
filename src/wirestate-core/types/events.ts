import { Optional } from "./general";

/**
 * Event identifier.
 */
export type EventType = string | symbol;

/**
 * Event object.
 */
export interface Event<P = unknown, T extends EventType = EventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Event handler signature.
 */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Unsubscribes from events, part of events subscription lifecycle.
 */
export type EventUnsubscriber = () => void;

/**
 * Internal dispatch entry.
 *
 * @internal
 */
export interface EventDispatchEntry {
  readonly types: Optional<ReadonlyArray<Event["type"]>>;
  readonly handler: EventHandler;
}

/**
 * Metadata for OnEvent decorated methods.
 *
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<EventType>>;
}
