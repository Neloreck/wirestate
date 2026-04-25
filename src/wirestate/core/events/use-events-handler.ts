import { Container } from "inversify";
import { type MutableRefObject, useEffect, useRef } from "react";

import { EventBus } from "@/wirestate/core/events/event-bus";
import { useContainer } from "@/wirestate/core/provision/use-container";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TEventHandler } from "@/wirestate/types/events";
import type { Maybe } from "@/wirestate/types/general";

/**
 * Subscribes a component to all events without type filtering.
 *
 * @param handler - event handler invoked for every emitted event
 */
export function useEventsHandler(handler: TEventHandler): void {
  const handlerRef: MutableRefObject<Maybe<TEventHandler>> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<EventBus>(EVENT_BUS_TOKEN).subscribe((event) => {
      handlerRef.current?.(event);
    });
  }, [container]);
}
