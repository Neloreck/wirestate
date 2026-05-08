import { Container } from "inversify";
import { type MutableRefObject, useEffect, useRef } from "react";

import { EventBus } from "@/wirestate/core/events/event-bus";
import { useContainer } from "@/wirestate/core/provision/use-container";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TEventHandler, TEventType } from "@/wirestate/types/events";

/**
 * Subscribes a component to multiple event types.
 *
 * @param types - event types to filter by
 * @param handler - events handler
 */
export function useEvents(types: ReadonlyArray<TEventType>, handler: TEventHandler): void {
  const typesRef: MutableRefObject<ReadonlyArray<TEventType>> = useRef(types);
  const handlerRef: MutableRefObject<TEventHandler> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<EventBus>(EVENT_BUS_TOKEN).subscribe((event) => {
      if (typesRef.current.includes(event.type)) {
        handlerRef.current?.(event);
      }
    });
  }, [container]);
}
