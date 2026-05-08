import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Event, EventHandler, EventType, EventUnsubscriber } from "@/wirestate-core/types/events";

/**
 * Dispatches events to subscribers.
 */
export class EventBus {
  private readonly handlers: Set<EventHandler> = new Set();

  /**
   * Broadcasts an event to all subscribers.
   *
   * @param event - event to emit
   */
  public emit<P = unknown, T extends EventType = EventType, F = unknown>(event: Event<P, T, F>): void {
    // Snapshot prevents concurrent modification errors if handlers sub/unsub during emit.
    const snapshot: Array<EventHandler> = Array.from(this.handlers);

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
  public subscribe(handler: EventHandler): EventUnsubscriber {
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
