import { type EventEmitOptions, type EventType } from "@wirestate/core";

/**
 * Represents the function returned by {@link useEventEmitter}.
 *
 * @group Events
 *
 * @template P - The type of the event payload.
 * @template T - The event type.
 * @template S - The type of the event source.
 *
 * @param type - The event type.
 * @param payload - Optional event payload.
 * @param options - Optional emit options.
 */
export type EventEmitter<P = unknown, T extends EventType = EventType, S = unknown> = (
  type: T,
  payload?: P,
  options?: EventEmitOptions<S>
) => void;
