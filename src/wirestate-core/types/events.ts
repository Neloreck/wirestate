import { Optional } from "@/wirestate-core/types/general";

/**
 * Event identifier.
 */
export type TEventType = string | symbol;

/**
 * Event object.
 */
export interface IEvent<P = unknown, T extends TEventType = TEventType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Event handler signature.
 */
export type TEventHandler<E extends IEvent = IEvent> = (event: E) => void;

/**
 * Unsubscribes from events, part of events subscription lifecycle.
 */
export type TEventUnsubscriber = () => void;

/**
 * Internal dispatch entry.
 *
 * @internal
 */
export interface IEventDispatchEntry {
  readonly types: Optional<ReadonlyArray<IEvent["type"]>>;
  readonly handler: TEventHandler;
}

/**
 * Metadata for OnEvent decorated methods.
 *
 * @internal
 */
export interface IEventHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<TEventType>>;
}

/**
 * Event emitter signature.
 */
export type TEventEmitter<P = unknown, T extends TEventType = TEventType, F = unknown> = (
  type: T,
  payload?: P,
  from?: F
) => void;
