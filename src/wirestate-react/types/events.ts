import { EventEmitOptions, EventType } from "@wirestate/core";

/**
 * Represents the function returned by {@link useEventEmitter}.
 *
 * @remarks
 * Typically returned by {@link useEventEmitter}. Supports optional payload and options.
 *
 * @group Events
 *
 * @template P - The type of the event payload.
 * @template T - The event identifier type.
 * @template F - The type of the event source identifier.
 *
 * @param type - The event identifier.
 * @param payload - Optional event payload.
 * @param options - Optional emit options.
 */
export type EventEmitter<P = unknown, T extends EventType = EventType, F = unknown> = (
  type: T,
  payload?: P,
  options?: EventEmitOptions<F>
) => void;
