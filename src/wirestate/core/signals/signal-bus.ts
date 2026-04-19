import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import type { ISignal, TSignalHandler, TSignalUnsubscribe } from "@/wirestate/types/signals";

/**
 * Dispatches signals to subscribers.
 * Scoped to a container under {@link SIGNAL_BUS_TOKEN}.
 */
export class SignalBus {
  private readonly handlers: Set<TSignalHandler> = new Set();

  /**
   * Broadcasts a signal to all subscribers.
   *
   * @param signal - signal to emit
   */
  public emit<S extends ISignal>(signal: S): void {
    // Snapshot prevents concurrent modification errors if handlers sub/unsub during emit.
    const snapshot: Array<TSignalHandler> = Array.from(this.handlers);

    for (const handler of snapshot) {
      try {
        handler(signal);
      } catch (error) {
        // Prevent one failing listener from stalling the entire bus.
        console.error("[wirestate] Signal handler threw:", error);
      }
    }
  }

  /**
   * Subscribes a handler to all signals.
   * Returns an unsubscribe function.
   *
   * @param handler - signal handler function
   * @returns unsubscribe function
   */
  public subscribe(handler: TSignalHandler): TSignalUnsubscribe {
    dbg.info(prefix(__filename), "Adding signal subscription:", {
      handler,
      bus: this,
    });

    this.handlers.add(handler);

    return () => {
      dbg.info(prefix(__filename), "Removing signal subscription:", {
        handler,
        bus: this,
      });

      this.handlers.delete(handler);
    };
  }

  /**
   * Removes all registered handlers.
   *
   * @internal
   */
  public clear(): void {
    this.handlers.clear();
  }
}
