import { Container, EventBus, EventHandler } from "@wirestate/core";
import { type MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";
import { Maybe } from "../types/general";

/**
 * Subscribes a component to all events without type filtering.
 *
 * @group events
 *
 * @param handler - Event handler invoked for every emitted event.
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
