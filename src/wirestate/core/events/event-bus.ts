import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import { IEvent, TEventHandler, TEventType, TEventUnsubscriber } from "@/wirestate/types/events";

/**
 * Dispatches events to subscribers.
 * Scoped to a container under {@link EVENT_BUS_TOKEN}.
 */
export class EventBus {
  private readonly handlers: Set<TEventHandler> = new Set();

  /**
   * Broadcasts an event to all subscribers.
   *
   * @param event - event to emit
   */
  public emit<P = unknown, T extends TEventType = TEventType, F = unknown>(event: IEvent<P, T, F>): void {
    // Snapshot prevents concurrent modification errors if handlers sub/unsub during emit.
    const snapshot: Array<TEventHandler> = Array.from(this.handlers);

    for (const handler of snapshot) {
      try {
        handler(event);
      } catch (error) {
        // Prevent one failing listener from stalling the entire bus.
        console.error("[wirestate] Event handler threw:", error);
      }
    }
  }

  /**
   * Subscribes a handler to all events.
   * Returns an unsubscribe function.
   *
   * @param handler - event handler function
   * @returns unsubscribe function
   */
  public subscribe(handler: TEventHandler): TEventUnsubscriber {
    dbg.info(prefix(__filename), "Adding event subscription:", {
      handler,
      bus: this,
    });

    this.handlers.add(handler);

    return () => {
      dbg.info(prefix(__filename), "Removing event subscription:", {
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
