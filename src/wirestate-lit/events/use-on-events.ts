import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventHandler, EventType } from "@wirestate/core";

import { Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * @group events
 */
export interface UseOnEventsOptions<E extends Event = Event> {
  handler: EventHandler<E>;
  types: Optional<EventType | ReadonlyArray<EventType>>;
}

/**
 * @group events
 *
 * @param host
 * @param root0
 * @param root0.types
 * @param root0.handler
 */
export function useOnEvents<E extends Event = Event>(
  host: ReactiveElement,
  { types, handler }: UseOnEventsOptions
): OnEventController<E> {
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return new OnEventController<E>(host, normalized, handler);
}
