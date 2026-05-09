import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Event, EventHandler, EventType, EventUnsubscriber } from "../types/events";

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

    return () => this.unsubscribe(handler);
  }

  /**
   * Removes a specific subscriber by handler reference.
   * No-ops silently if the handler was not subscribed.
   *
   * @param handler - event handler to remove
   */
  public unsubscribe(handler: EventHandler): void {
    dbg.info(prefix(__filename), "Removing event subscription:", {
      handler,
      bus: this,
    });

    this.handlers.delete(handler);
  }

  /**
   * Checks if any handler is registered.
   *
   * @returns true if any handler exists
   */
  public has(): boolean {
    return this.handlers.size > 0;
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
