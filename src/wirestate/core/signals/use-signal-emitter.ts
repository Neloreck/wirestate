import { Container } from "inversify";
import { useCallback } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TSignalEmitter, TSignalType } from "@/wirestate/types/signals";

/**
 * Returns a stable function to emit signals.
 *
 * @returns signal emitter
 */
export function useSignalEmitter<P = unknown, T extends TSignalType = TSignalType>(): TSignalEmitter<P, T> {
  const container: Container = useIocContext().container;

  return useCallback(
    <P, T extends TSignalType>(type: T, payload?: P, from?: unknown) => {
      dbg.info(prefix(__filename), "Emit signal:", {
        type,
        payload,
        from,
      });

      container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit({ type, payload, from });
    },
    [container]
  );
}
