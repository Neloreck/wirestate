import { Container } from "inversify";
import { MutableRefObject, useEffect, useRef } from "react";

import { EventBus, EventHandler, EventType, EVENT_BUS } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";

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
    return container.get<EventBus>(EVENT_BUS).subscribe((event) => {
      if (event.type === typeRef.current) {
        handlerRef.current?.(event);
      }
    });
  }, [container, type]);
}
