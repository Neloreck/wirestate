import { Container } from "inversify";
import { type MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TSignalHandler, TSignalType } from "@/wirestate/types/signals";

/**
 * Subscribes a component to multiple signal types.
 *
 * @param types - signal types to filter by
 * @param handler - signal handler
 */
export function useSignals(types: ReadonlyArray<TSignalType>, handler: TSignalHandler): void {
  const typesRef: MutableRefObject<ReadonlyArray<TSignalType>> = useRef(types);
  const handlerRef: MutableRefObject<TSignalHandler> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<SignalBus>(SIGNAL_BUS_TOKEN).subscribe((signal) => {
      if (typesRef.current.includes(signal.type)) {
        handlerRef.current?.(signal);
      }
    });
  }, [container]);
}
