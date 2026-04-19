import type {
  ISignal,
  TSignalHandler,
  TSignalUnsubscribe,
} from '../types/signals';

/**
 * Dispatches signals to subscribers.
 * Scoped to a container under {@link SIGNAL_BUS_TOKEN}.
 */
export class SignalBus {
  private readonly handlers = new Set<TSignalHandler>();

  /**
   * Broadcasts a signal to all subscribers.
   *
   * @param signal - signal to emit
   */
  public emit<S extends ISignal>(signal: S): void {
    // Snapshot prevents concurrent modification errors if handlers sub/unsub during emit.
    const snapshot = Array.from(this.handlers);

    for (const handler of snapshot) {
      try {
        handler(signal);
      } catch (error) {
        // Prevent one failing listener from stalling the entire bus.
        console.error('[ioc] Signal handler threw:', error);
      }
    }
  }

  /**
   * Subscribes a handler to all signals.
   * Returns an unsubscribe function.
   *
   * @param handler - signal handler function
   */
  public subscribe(handler: TSignalHandler): TSignalUnsubscribe {
    this.handlers.add(handler);

    return () => {
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
