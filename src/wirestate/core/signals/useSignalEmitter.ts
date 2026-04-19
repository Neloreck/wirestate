import { Container } from "inversify";
import { useCallback } from "react";

import { useIocContext } from "../provision/useIocContext";
import { SIGNAL_BUS_TOKEN } from "../registry";
import type { ISignal, TSignalEmitter } from "../types/signals";

import { SignalBus } from "./SignalBus";

/**
 * Returns a stable function to emit signals.
 *
 * @returns signal emitter
 */
export function useSignalEmitter(): TSignalEmitter {
  const container: Container = useIocContext().container;

  return useCallback(
    (signal: ISignal) => {
      container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit(signal);
    },
    [container]
  );
}
