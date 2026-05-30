import { Optional } from "./general";

/**
 * Represents token used to emit and filter events.
 *
 * @group Events
 */
export type EventType = string | symbol;

/**
 * Represents event payload delivered to handlers.
 *
 * @group Events
 */
export interface WireEvent<P = unknown, T extends EventType = EventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Options used when emitting an event.
 *
 * @group Events
 *
 * @template F - Type of the event source.
 */
export interface EventEmitOptions<F = unknown> {
  /**
   * Optional source identifier attached to the emitted event.
   */
  readonly from?: F;
}

/**
 * Represents the function that handles an event.
 *
 * @group Events
 */
export type EventHandler<E extends WireEvent = WireEvent> = (event: E) => void;

/**
 * Represents the function that removes an event subscription.
 *
 * @group Events
 */
export type EventUnsubscriber = () => void;

/**
 * Represents internal event dispatch entry.
 *
 * @group Events
 * @internal
 */
export interface EventDispatchEntry {
  readonly types: Optional<ReadonlyArray<WireEvent["type"]>>;
  readonly handler: EventHandler;
}

/**
 * Represents metadata for `@OnEvent` decorated methods.
 *
 * @group Events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<EventType>>;
}
