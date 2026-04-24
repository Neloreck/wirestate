import { type Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TSignalType } from "@/wirestate/types/signals";

/**
 * Emits signals for container from outside scope.
 *
 * @param container - inversify container
 * @param type - signal type ot emit
 * @param payload - signal payload
 * @param from - optional indicator of the signal source
 */
export function emitSignal<P, T extends TSignalType>(container: Container, type: T, payload?: P, from?: unknown): void {
  dbg.info(prefix(__filename), "Emit signal:", { type: type, payload, container });

  container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit({ type, payload, from });
}
