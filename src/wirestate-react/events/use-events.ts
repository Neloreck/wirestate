import { Container, EventBus, EventHandler, EventType } from "@wirestate/core";
import { RefObject, useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Subscribes a component to multiple event types on the {@link EventBus}.
 *
 * @remarks
 * Similar to {@link useEvent}, but allows listening for a collection of event
 * types using a single handler.
 * The handler and type list are synced via `useRef` to avoid stale closures.
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

  useIsomorphicLayoutEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      if (typesRef.current.includes(event.type)) {
        handlerRef.current?.(event);
      }
    });
  }, [container]);
}
