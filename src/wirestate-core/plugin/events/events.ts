import { type Nullable } from "../../types/general";

/**
 * Identifies an event for emitting and subscribing.
 *
 * @remarks
 * Event types are compared by value for strings and numbers, and by reference
 * for symbols.
 *
 * @group Events
 */
export type EventType = string | symbol | number;

/**
 * Event delivered to handlers: its type, optional payload, and optional source.
 *
 * @remarks
 * `payload` and `source` are present only when the emitted value is not
 * `undefined`. Other falsy values, such as `null`, `0`, and `false`, are
 * preserved.
 *
 * @group Events
 *
 * @template P - Payload type.
 * @template T - Event type.
 * @template S - Source type.
 */
export interface WireEvent<P = unknown, T extends EventType = EventType, S = unknown> {
  /**
   * Event type used for matching subscriptions.
   */
  readonly type: T;

  /**
   * Payload supplied by the emitter, when one was provided.
   */
  readonly payload?: P;

  /**
   * Source supplied by the emitter, when one was provided.
   */
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
   *
   * @remarks
   * Use this for diagnostics or caller context.
   */
  readonly source?: S;
}

/**
 * Receives an emitted event from the bus.
 *
 * @template E - Event shape delivered to the handler.
 *
 * @group Events
 */
export type EventHandler<E extends WireEvent = WireEvent> = (event: E) => void;

/**
 * Removes the event subscription it was returned for.
 *
 * @remarks
 * Each subscription has its own unsubscriber. Calling it removes only that
 * subscription, even when the same handler function was subscribed more than
 * once.
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
