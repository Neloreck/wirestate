import { type Container, type EventHandler, type EventType, EventBus } from "@wirestate/core";
import { type RefObject, useRef } from "react";

import { useContainer } from "../context/use-container";
import { shallowEqualArrays } from "../utils/shallow-equal";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Subscribes a component to multiple event types on the {@link EventBus}.
 *
 * @remarks
 * Similar to {@link useEvent}, but allows listening for a collection of event
 * types using a single handler. The subscription follows the active container
 * and is cleaned up when the component unmounts, the container changes, or the
 * event type list changes.
 *
 * @group Events
 *
 * @param types - Array of event types (strings or symbols) to filter by.
 * @param handler - Function invoked when any of the specified events are emitted.
 *
 * @example
 * ```tsx
 * useEvents(["USER_UPDATED", "USER_DELETED"], (event) => {
 *   refreshList();
 * });
 * ```
 */
export function useEvents(types: ReadonlyArray<EventType>, handler: EventHandler): void {
  const typesRef: RefObject<ReadonlyArray<EventType>> = useRef(types);
  const handlerRef: RefObject<EventHandler> = useRef(handler);
  const container: Container = useContainer();

  // Keep a stable reference while membership is unchanged so inline type arrays do not resubscribe on every render.
  if (!shallowEqualArrays(typesRef.current, types)) {
    typesRef.current = types;
  }

  const subscribedTypes: ReadonlyArray<EventType> = typesRef.current;

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe(subscribedTypes, (event) => handlerRef.current?.(event));
  }, [container, subscribedTypes]);
}
