import { EventType } from "@wirestate/core";

/**
 * Signature for a function that emits events via the EventBus.
 *
 * @remarks
 * Typically returned by {@link useEventEmitter}. Supports optional payload
 * and source identifier.
 *
 * @group events
 *
 * @template P - The type of the event payload.
 * @template T - The event identifier type.
 * @template F - The type of the event source identifier.
 *
 * @param type - The event identifier.
 * @param payload - Optional data associated with the event.
 * @param from - Optional identifier of the event source.
 */
export type EventEmitter<P = unknown, T extends EventType = EventType, F = unknown> = (
  type: T,
  payload?: P,
  from?: F
) => void;
