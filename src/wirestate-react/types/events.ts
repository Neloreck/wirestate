import { EventType } from "@wirestate/core";

/**
 * Event emitter signature.
 *
 * @group events
 */
export type EventEmitter<P = unknown, T extends EventType = EventType, F = unknown> = (
  type: T,
  payload?: P,
  from?: F
) => void;
