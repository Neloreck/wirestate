import { type Container, type EventEmitOptions, type EventType, EventBus } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";
import { type EventEmitter } from "../types/events";

/**
 * Returns a stable function to emit events via the {@link EventBus}.
 *
 * @remarks
 * The returned emitter is memoized using `useMemo` and stays stable while the
 * active container is unchanged.
 *
 * @group Events
 *
 * @template P - Default payload type for emitted events.
 * @template T - Default event type.
 * @template S - Default source type.
 *
 * @returns An event emitter function.
 *
 * @example
 * ```tsx
 * const emit: EventEmitter = useEventEmitter();
 *
 * const onClick = () => emit("BUTTON_CLICKED", { id: "submit" }, { source: "submit-button" });
 * ```
 */
export function useEventEmitter<P = unknown, T extends EventType = EventType, S = unknown>(): EventEmitter<P, T, S> {
  const container: Container = useContainer();

  return useMemo(() => {
    const bus: EventBus = container.get(EventBus);

    return <P, T extends EventType>(type: T, payload?: P, options?: EventEmitOptions<S>) => {
      bus.emit(type, payload, options);
    };
  }, [container]);
}
