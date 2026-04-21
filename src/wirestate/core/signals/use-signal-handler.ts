import { Container } from "inversify";
import { type MutableRefObject, useEffect, useRef } from "react";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { Maybe } from "@/wirestate/types/general";
import type { TSignalHandler } from "@/wirestate/types/signals";

/**
 * Subscribes a component to all signals without type filtering.
 *
 * @param handler - signal handler invoked for every emitted signal
 */
export function useSignalHandler(handler: TSignalHandler): void {
  const handlerRef: MutableRefObject<Maybe<TSignalHandler>> = useRef(handler);
  const container: Container = useContainer();

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return container.get<SignalBus>(SIGNAL_BUS_TOKEN).subscribe((signal) => {
      handlerRef.current?.(signal);
    });
  }, [container]);
}
