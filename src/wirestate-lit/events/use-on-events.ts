import { ReactiveElement } from "@lit/reactive-element";
import { Event, EventHandler, EventType } from "@wirestate/core";

import { Optional } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * Options for the {@link useOnEvents} hook.
 *
 * @group events
 */
export interface UseOnEventsOptions<E extends Event = Event> {
  /**
   * Event handler function.
   */
  handler: EventHandler<E>;
  /**
   * Event types to listen for. If null or undefined, all events will be handled.
   */
  types?: Optional<EventType | ReadonlyArray<EventType>>;
}

/**
 * Hook (controller) to handle events from the event bus.
 *
 * @group events
 *
 * @param host - the host element
 * @param options - event handling options
 * @param options.handler - event handler function
 * @param options.types - event types to listen for, if null or undefined, all events will be handled
 * @returns events subscription controller
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
 *     types: [MyEvent],
 *     handler: (event) => console.log(event),
 *   });
 * }
 * ```
 */
export function useOnEvents<E extends Event = Event>(
  host: ReactiveElement,
  { types, handler }: UseOnEventsOptions
): OnEventController<E> {
  const normalized: Optional<ReadonlyArray<EventType>> =
    types === undefined ? null : Array.isArray(types) ? [...(types as ReadonlyArray<EventType>)] : [types as EventType];

  return new OnEventController<E>(host, normalized, handler);
}
