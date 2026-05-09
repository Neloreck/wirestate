import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventHandler, EventType } from "@wirestate/core";

import { Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

export interface UseOnEventsOptions<E extends Event = Event> {
  handler: EventHandler<E>;
  types: Optional<EventType | ReadonlyArray<EventType>>;
}

export function useOnEvents<E extends Event = Event>(
  host: ReactiveElement,
  { types, handler }: UseOnEventsOptions
): OnEventController<E> {
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return new OnEventController<E>(host, normalized, handler);
}
