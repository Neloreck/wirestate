import { Container, EventBus, EventHandler, EventType } from "@wirestate/core";
import { MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Subscribes a component to events.
 *
 * @param type - event type to listen to
 * @param handler - event handler to invoke when event is emitted
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
