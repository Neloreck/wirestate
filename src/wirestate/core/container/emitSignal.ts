import { type Container } from "inversify";

import { SIGNAL_BUS_TOKEN } from "../registry";
import { SignalBus } from "../signals/SignalBus";
import type { ISignal } from "../types/signals";

/**
 * Emits signals from outside an AbstractService.
 *
 * @param container - inversify container
 * @param signal - signal to emit
 */
export function emitSignal<P>(container: Container, signal: ISignal<P>): void {
  container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit(signal);
}
