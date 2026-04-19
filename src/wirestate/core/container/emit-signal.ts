import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { ISignal } from "@/wirestate/types/signals";

/**
 * Emits signals from outside an AbstractService.
 *
 * @param container - inversify container
 * @param signal - signal to emit
 */
export function emitSignal<P>(container: Container, signal: ISignal<P>): void {
  dbg.info(prefix(__filename), "Emit signal:", { type: signal?.type, signal, container });

  container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit(signal);
}
