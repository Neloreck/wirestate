import { type Container, type EventHandler, EventBus } from "@wirestate/core";
import { type RefObject, useRef } from "react";

import { useContainer } from "../context/use-container";
import { type Maybe } from "../types/general";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Subscribes a component to all events on the {@link EventBus} without type filtering.
 *
 * @remarks
 * Useful for logging, debugging, or cross-cutting concerns that need to see
 * every event passing through the bus.
 * The handler is synced via `useRef` to avoid stale closures.
 * The subscription follows the active container and is cleaned up when the
 * component unmounts or the container changes.
 *
 * @group Events
 *
 * @param handler - Event handler invoked for every emitted event.
 *
 * @example
 * ```tsx
 * useAllEvents((event) => {
 *   console.log("Event received:", event.type, event.payload);
 * });
 * ```
 */
export function useAllEvents(handler: EventHandler): void {
  const handlerRef: RefObject<Maybe<EventHandler>> = useRef(handler);
  const container: Container = useContainer();

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      handlerRef.current?.(event);
    });
  }, [container]);
}
