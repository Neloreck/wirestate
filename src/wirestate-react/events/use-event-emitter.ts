import { Container, EventBus, EventType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate-react/provision/use-ioc-context";
import { EventEmitter } from "@/wirestate-react/types/events";

/**
 * Returns a stable function to emit events.
 *
 * @returns event emitter
 */
export function useEventEmitter<P = unknown, T extends EventType = EventType>(): EventEmitter<P, T> {
  const container: Container = useIocContext().container;

  return useCallback(
    <P, T extends EventType>(type: T, payload?: P, from?: unknown) => {
      dbg.info(prefix(__filename), "Emit event:", {
        type,
        payload,
        from,
      });

      container.get(EventBus).emit({ type, payload, from });
    },
    [container]
  );
}
