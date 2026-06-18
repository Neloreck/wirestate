import { type Container, type EventHandler, type EventType, EventBus } from "@wirestate/core";
import { type RefObject, useRef } from "react";

import { useContainer } from "../context/use-container";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect";

/**
 * Subscribes a component to a specific event type on the {@link EventBus}.
 *
 * @remarks
 * The subscription follows the active container and is cleaned up when the
 * component unmounts, the container changes, or the event type changes.
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
  const handlerRef: RefObject<EventHandler> = useRef(handler);
  const container: Container = useContainer();

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useIsomorphicLayoutEffect(() => {
    return container.get(EventBus).subscribe(type, (event) => handlerRef.current?.(event));
  }, [container, type]);
}
