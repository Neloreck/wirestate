import { type Nullable } from "../../types/general";

/**
 * Represents the type used to emit and filter events.
 *
 * @group Events
 */
export type EventType = string | symbol | number;

/**
 * Represents event payload delivered to handlers.
 *
 * @group Events
 */
export interface WireEvent<P = unknown, T extends EventType = EventType, S = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly source?: S;
}

/**
 * Options used when emitting an event.
 *
 * @group Events
 *
 * @template S - Type of the event source.
 */
export interface EventEmitOptions<S = unknown> {
  /**
   * Optional source attached to the emitted event.
   */
  readonly source?: S;
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
export type EventUnsubscribe = () => void;

/**
 * Represents a single bus subscription for one decorated method.
 *
 * @remarks
 * Produced by `buildEventDispatcher`, one per `@OnEvent` method. `types` is
 * `null` for catch-all handlers and the method's event types otherwise, so the
 * bus indexes the {@link handler} directly under the matching buckets.
 *
 * @group Events
 * @internal
 */
export interface EventDispatch {
  readonly types: Nullable<ReadonlyArray<EventType>>;
  readonly handler: EventHandler;
}

/**
 * Represents metadata for `@OnEvent` decorated methods.
 *
 * @remarks
 * Type lists are normalized to a deduplicated array at registration, or `null`
 * for catch-all handlers.
 *
 * @group Events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Nullable<ReadonlyArray<EventType>>;
}
