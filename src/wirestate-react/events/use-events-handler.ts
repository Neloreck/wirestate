import { Container } from "inversify";
import { type MutableRefObject, useEffect, useRef } from "react";

import { EVENT_BUS, EventBus, EventHandler } from "@/wirestate-core";
import { useContainer } from "@/wirestate-react/provision/use-container";
import { Maybe } from "@/wirestate-react/types/general";

/**
 * Subscribes a component to all events without type filtering.
 *
 * @param handler - event handler invoked for every emitted event
 */
export function useEventsHandler(handler: EventHandler): void {
  const handlerRef: MutableRefObject<Maybe<EventHandler>> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<EventBus>(EVENT_BUS).subscribe((event) => {
      handlerRef.current?.(event);
    });
  }, [container]);
}
