import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventHandler, EventType } from "@wirestate/core";

import { Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * Represents options for the {@link useOnEvents} hook.
 *
 * @group Events
 */
export interface UseOnEventsOptions<E extends Event = Event> {
  /**
   * The event handler function.
   */
  handler: EventHandler<E>;
  /**
   * Event types to listen for. If null or undefined, all events will be handled.
   */
  types?: Optional<EventType | ReadonlyArray<EventType>>;
}

/**
 * Hook that subscribes to events for the host element's lifetime.
 *
 * @group Events
 *
 * @param host - The host element.
 * @param options - Event handling options.
 * @param options.handler - Event handler function.
 * @param options.types - Event types to listen for, if null or undefined, all events will be handled.
 * @returns An instance of {@link OnEventController}.
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private eventHandler = useOnEvents(this, {
 *     handler: (event) => console.log(event),
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyElement extends LitElement {
 *   private eventHandler = useOnEvents(this, {
 *     types: ["MY_EVENT"],
 *     handler: (event) => console.log(event),
 *   });
 * }
 * ```
 */
export function useOnEvents<E extends Event = Event>(
  host: ReactiveElement,
  { types, handler }: UseOnEventsOptions
): OnEventController<E> {
  const normalized: Optional<ReadonlyArray<EventType>> = types
    ? Array.isArray(types)
      ? [...(types as ReadonlyArray<EventType>)]
      : [types as EventType]
    : null;

  return new OnEventController<E>(host, normalized, handler);
}
