import { Container, EventBus, EventHandler, EventType } from "@wirestate/core";
import { RefObject, useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Subscribes a component to a specific event type on the {@link EventBus}.
 *
 * @remarks
 * The subscription is active for the component's lifetime and is automatically
 * cleaned up on unmount. The handler is synced via `useRef` to avoid stale
 * closures without requiring manual memoization of the handler function.
 *
 * @group Events
 *
 * @param type - Event type to listen for.
 * @param handler - Function invoked when the specified event is emitted.
 *
 * @example
 * ```tsx
 * useEvent("USER_LOGGED_IN", (event) => {
 *   console.log("User logged in:", event);
 * });
 * ```
 */
export function useEvent(type: EventType, handler: EventHandler): void {
  const typeRef: RefObject<EventType> = useRef(type);
  const handlerRef: RefObject<EventHandler> = useRef(handler);
  const container: Container = useContainer();

  useIsomorphicLayoutEffect(() => {
    typeRef.current = type;
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      if (event.type === typeRef.current) {
        handlerRef.current?.(event);
      }
    });
  }, [container]);
}
