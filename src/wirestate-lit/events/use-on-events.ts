import { type ReactiveElement } from "@lit/reactive-element";
import { type EventHandler, type EventType, type WireEvent } from "@wirestate/core";

import { type Nullable } from "../types/general";

import { OnEventController } from "./on-event-controller";

/**
 * Describes options for {@link useOnEvents}.
 *
 * @group Events
 */
export interface UseOnEventsOptions<E extends WireEvent = WireEvent> {
  /**
   * The event handler function.
   */
  handler: EventHandler<E>;
  /**
   * Event types to listen for. If null or undefined, all events will be handled.
   */
  types?: Nullable<EventType | ReadonlyArray<EventType>>;
}

/**
 * Subscribes to events for the host element's lifetime.
 *
 * @remarks
 * Registers when the host connects, unregisters when it disconnects, and
 * re-subscribes when the nearest container context changes. Omit `types`, or
 * pass `null`, to receive every event.
 *
 * @group Events
 *
 * @param host - Host element.
 * @param options - Event handling options.
 * @param options.handler - Event handler function.
 * @param options.types - Event types to listen for, if null or undefined, all events will be handled.
 * @returns Event controller.
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
export function useOnEvents<E extends WireEvent = WireEvent>(
  host: ReactiveElement,
  { types, handler }: UseOnEventsOptions<E>
): OnEventController<E> {
  const normalized: Nullable<ReadonlyArray<EventType>> =
    types === null || types === undefined
      ? null
      : Array.isArray(types)
        ? [...(types as ReadonlyArray<EventType>)]
        : [types as EventType];

  return new OnEventController<E>(host, normalized, handler);
}
