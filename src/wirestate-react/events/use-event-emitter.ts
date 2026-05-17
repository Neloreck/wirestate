import { Container, EventBus, EventType } from "@wirestate/core";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { EventEmitter } from "../types/events";

/**
 * Returns a stable function to emit events via the {@link EventBus}.
 *
 * @remarks
 * The returned emitter is memoized using `useCallback` and stays stable
 * for the lifetime of the container.
 *
 * @group Events
 *
 * @template P - Default payload type for emitted events.
 * @template T - Default event identifier type.
 *
 * @returns An event emitter function.
 *
 * @example
 * ```tsx
 * const emit: EventEmitter = useEventEmitter();
 *
 * const onClick = () => emit("BUTTON_CLICKED", { id: "submit" });
 * ```
 */
export function useEventEmitter<P = unknown, T extends EventType = EventType>(): EventEmitter<P, T> {
  const container: Container = useContainer();

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
