import { Container } from "inversify";
import { useCallback } from "react";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { ISignal, TSignalEmitter } from "@/wirestate/types/signals";

/**
 * Returns a stable function to emit signals.
 *
 * @returns signal emitter
 */
export function useSignalEmitter(): TSignalEmitter {
  const container: Container = useIocContext().container;

  return useCallback(
    (signal: ISignal) => {
      log.info(prefix(__filename), "Emit signal:", {
        type: signal?.type,
        signal,
      });

      container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit(signal);
    },
    [container]
  );
}
