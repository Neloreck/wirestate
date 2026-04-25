import { Container } from "inversify";
import { MutableRefObject, useEffect, useRef } from "react";

import { EventBus } from "@/wirestate/core/events/event-bus";
import { useContainer } from "@/wirestate/core/provision/use-container";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TEventHandler, TEventType } from "@/wirestate/types/events";

/**
 * Subscribes a component to events.
 *
 * @param type - event type to listen to
 * @param handler - event handler to invoke when event is emitted
 */
export function useEvent(type: TEventType, handler: TEventHandler): void {
  const typeRef: MutableRefObject<TEventType> = useRef(type);
  const handlerRef: MutableRefObject<TEventHandler> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    typeRef.current = type;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<EventBus>(EVENT_BUS_TOKEN).subscribe((event) => {
      if (event.type === typeRef.current) {
        handlerRef.current?.(event);
      }
    });
  }, [container, type]);
}
