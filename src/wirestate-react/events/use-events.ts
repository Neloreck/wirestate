import { Container, EventBus, EventHandler, EventType } from "@wirestate/core";
import { type MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "../provision/use-container";

/**
 * Subscribes a component to multiple event types.
 *
 * @param types - event types to filter by
 * @param handler - events handler
 */
export function useEvents(types: ReadonlyArray<EventType>, handler: EventHandler): void {
  const typesRef: MutableRefObject<ReadonlyArray<EventType>> = useRef(types);
  const handlerRef: MutableRefObject<EventHandler> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get(EventBus).subscribe((event) => {
      if (typesRef.current.includes(event.type)) {
        handlerRef.current?.(event);
      }
    });
  }, [container]);
}
