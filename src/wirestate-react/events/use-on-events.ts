import { type Container, type EventHandler, type EventType, type WireEvent, EventBus } from "@wirestate/core";
import { type RefObject, useRef } from "react";

import { useContainer } from "../container/use-container";
import type { Nullable } from "../types/general";
import { shallowEqualArrays } from "../utils/shallow-equal";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

type EventTypeSelector = Nullable<EventType | ReadonlyArray<EventType>>;

/**
 * Subscribes the component to every event on the active {@link EventBus}.
 *
 * @param handler - Handler invoked for every event.
 */
export function useOnEvents<E extends WireEvent = WireEvent>(handler: EventHandler<E>): void;

/**
 * Subscribes the component to one event type on the active {@link EventBus}.
 *
 * @param type - Event type to listen for.
 * @param handler - Handler invoked for matching events.
 */
export function useOnEvents<E extends WireEvent = WireEvent>(type: EventType, handler: EventHandler<E>): void;

/**
 * Subscribes the component to several event types on the active {@link EventBus}.
 *
 * @param types - Event types to listen for.
 * @param handler - Handler invoked for matching events.
 */
export function useOnEvents<E extends WireEvent = WireEvent>(
  types: ReadonlyArray<EventType>,
  handler: EventHandler<E>
): void;

/**
 * Subscribes the component to events on the active container's {@link EventBus}.
 *
 * @remarks
 * Pass a single event type, an array of types, or only a handler to receive
 * every event, mirroring {@link EventBus.subscribe}. The subscription is scoped
 * to the component and is removed automatically when it unmounts, the active
 * container changes, or the set of listened types changes.
 * Requires `EventBus` to be bound in the active container or an ancestor.
 *
 * @group Events
 *
 * @param typesOrHandler - The event type, an array of event types, or the handler itself to receive every event.
 * @param maybeHandler - The handler invoked for matching events. Omit it when the first argument is the handler.
 *
 * @throws `WirestateError` if the active container cannot resolve `EventBus`.
 *
 * @example
 * ```tsx
 * // Listen to one event type.
 * useOnEvents("CART_ITEM_ADDED", (event) => console.info(event.payload));
 *
 * // Listen to several event types.
 * useOnEvents(["CART_ITEM_ADDED", "CART_VIEWED"], (event) => console.info(event.type));
 *
 * // Listen to every event.
 * useOnEvents((event) => console.info(event.type));
 * ```
 */
export function useOnEvents(
  typesOrHandler: EventHandler | EventType | ReadonlyArray<EventType>,
  maybeHandler?: EventHandler
): void {
  // Resolve overloads: a lone function argument is a catch-all handler (mirrors EventBus.subscribe).
  const handler: EventHandler = maybeHandler ?? (typesOrHandler as EventHandler);
  const types: EventTypeSelector =
    maybeHandler === undefined ? null : (typesOrHandler as EventType | ReadonlyArray<EventType>);

  const container: Container = useContainer();
  const typesRef: RefObject<EventTypeSelector> = useRef(types);
  const handlerRef: RefObject<EventHandler> = useRef(handler);

  // Keep a stable reference while membership is unchanged so inline type arrays do not resubscribe on every render.
  const previous: EventTypeSelector = typesRef.current;
  const isSame: boolean =
    previous === types ||
    (Array.isArray(previous) &&
      Array.isArray(types) &&
      shallowEqualArrays(previous as ReadonlyArray<EventType>, types as ReadonlyArray<EventType>));

  if (!isSame) {
    typesRef.current = types;
  }

  const subscribedTypes: EventTypeSelector = typesRef.current;

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe(subscribedTypes, (event) => handlerRef.current?.(event));
  }, [container, subscribedTypes]);
}
