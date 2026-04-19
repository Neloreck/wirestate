import { Container } from "inversify";
import { useCallback } from "react";

import { useIocContext } from "@/wirestate/core/provision/useIocContext";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import type { ISignal, TSignalEmitter } from "@/wirestate/types/signals";

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
