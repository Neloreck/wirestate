import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EventBus } from "@/wirestate/core/events/event-bus";
import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import type { TEventEmitter, TEventType } from "@/wirestate/types/events";

/**
 * Returns a stable function to emit events.
 *
 * @returns event emitter
 */
export function useEventEmitter<P = unknown, T extends TEventType = TEventType>(): TEventEmitter<P, T> {
  const container: Container = useIocContext().container;

  return useCallback(
    <P, T extends TEventType>(type: T, payload?: P, from?: unknown) => {
      dbg.info(prefix(__filename), "Emit event:", {
        type,
        payload,
        from,
      });

      container.get<EventBus>(EVENT_BUS_TOKEN).emit({ type, payload, from });
    },
    [container]
  );
}
