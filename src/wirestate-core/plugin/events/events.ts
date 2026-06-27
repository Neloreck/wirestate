import { type Nullable } from "../../types/general";

/**
 * Identifies an event for emitting and subscribing.
 *
 * @group Events
 */
export type EventType = string | symbol | number;

/**
 * Event delivered to handlers: its type, optional payload, and optional source.
 *
 * @group Events
 */
export interface WireEvent<P = unknown, T extends EventType = EventType, S = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly source?: S;
}

/**
 * Options for emitting an event.
 *
 * @group Events
 *
 * @template S - Source type.
 */
export interface EventEmitOptions<S = unknown> {
  /**
   * Source attached to the emitted event.
   */
  readonly source?: S;
}

/**
 * Receives an emitted event from the bus.
 *
 * @group Events
 */
export type EventHandler<E extends WireEvent = WireEvent> = (event: E) => void;

/**
 * Removes the event subscription it was returned for.
 *
 * @group Events
 */
export type EventUnsubscribe = () => void;

/**
 * One bus subscription for a decorated method.
 *
 * @remarks
 * Produced per `@OnEvent` method. `types` is `null` for catch-all handlers, otherwise the method's event types.
 *
 * @group Events
 * @internal
 */
export interface EventDispatch {
  readonly types: Nullable<ReadonlyArray<EventType>>;
  readonly handler: EventHandler;
}

/**
 * Metadata for `@OnEvent` decorated methods.
 *
 * @remarks
 * Type lists are normalized to a deduplicated array, or `null` for catch-all handlers.
 *
 * @group Events
 * @internal
 */
export interface EventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Nullable<ReadonlyArray<EventType>>;
}
