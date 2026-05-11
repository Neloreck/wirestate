import { Container, EventBus, EventHandler, EventType } from "@wirestate/core";
import { MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Subscribes a component to a specific event type on the {@link EventBus}.
 *
 * @remarks
 * The subscription is active for the component's lifetime and is automatically
 * cleaned up on unmount. The handler is synced via `useRef` to avoid stale
 * closures without requiring manual memoization of the handler function.
 *
 * @group events
 *
 * @param type - Event type to listen for.
 * @param handler - Function invoked when the specified event is emitted.
 *
 * @example
 * ```tsx
 * useEvent("USER_LOGGED_IN", (event) => {
 *   console.log("User logged in:,", event);
 * });
 * ```
 */
export function useEvent(type: EventType, handler: EventHandler): void {
  const typeRef: MutableRefObject<EventType> = useRef(type);
  const handlerRef: MutableRefObject<EventHandler> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    typeRef.current = type;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      if (event.type === typeRef.current) {
        handlerRef.current?.(event);
      }
    });
  }, [container, type]);
}
