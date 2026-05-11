import { Container, EventBus, EventHandler } from "@wirestate/core";
import { type MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";
import { Maybe } from "../types/general";

/**
 * Subscribes a component to all events on the {@link EventBus} without type filtering.
 *
 * @remarks
 * Useful for logging, debugging, or cross-cutting concerns that need to see
 * every event passing through the bus.
 * The handler is synced via `useRef` to avoid stale closures.
 * The subscription is automatically cleaned up on unmount.
 *
 * @group Events
 *
 * @param handler - Event handler invoked for every emitted event.
 *
 * @example
 * ```tsx
 * useEventsHandler((event) => {
 *   console.log('Event receieved:', event.type, event.payload);
 * });
 * ```
 */
export function useEventsHandler(handler: EventHandler): void {
  const handlerRef: MutableRefObject<Maybe<EventHandler>> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      handlerRef.current?.(event);
    });
  }, [container]);
}
