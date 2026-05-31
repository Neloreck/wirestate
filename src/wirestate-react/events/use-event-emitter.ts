import { Container, EventBus, EventEmitOptions, EventType } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { EventEmitter } from "../types/events";

/**
 * Returns a stable function to emit events via the {@link EventBus}.
 *
 * @remarks
 * The returned emitter is memoized using `useMemo` and stays stable
 * for the lifetime of the container.
 *
 * @group Events
 *
 * @template P - Default payload type for emitted events.
 * @template T - Default event identifier type.
 * @template F - Default source identifier type.
 *
 * @returns An event emitter function.
 *
 * @example
 * ```tsx
 * const emit: EventEmitter = useEventEmitter();
 *
 * const onClick = () => emit("BUTTON_CLICKED", { id: "submit" }, { from: "submit-button" });
 * ```
 */
export function useEventEmitter<P = unknown, T extends EventType = EventType, F = unknown>(): EventEmitter<P, T, F> {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: EventBus = container.get(EventBus);

    return <P, T extends EventType>(type: T, payload?: P, options?: EventEmitOptions<F>) => {
      dbg.info(prefix(__filename), "Emit event:", {
        type,
        payload,
        options,
      });

      bus.emit(type, payload, options);
    };
  }, [container]);
}
