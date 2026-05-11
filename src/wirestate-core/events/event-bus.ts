import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Event, EventHandler, EventType, EventUnsubscriber } from "../types/events";

/**
 * Orchestrates event broadcasting to multiple subscribers.
 *
 * @remarks
 * The `EventBus` facilitates decoupled, many-to-many communication.
 * Unlike commands or queries, which are dispatched to a single handler,
 * events are broadcast to all registered subscribers.
 *
 * @group events
 */
export class EventBus {
  private readonly handlers: Set<EventHandler> = new Set();

  /**
   * Broadcasts an event to all registered subscribers.
   *
   * @remarks
   * Handlers are executed in a try-catch block to ensure that a single
   * failing subscriber does not prevent others from receiving the event.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event identifier.
   * @template F - Type of the event source.
   *
   * @param event - The event object to broadcast.
   *
   * @example
   * ```typescript
   * eventBus.emit({
   *   type: "USER_LOGGED_IN",
   *   payload: { userId: "123" },
   *   from: AuthService
   * });
   * ```
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
   * Registers a handler to receive all broadcasted events.
   *
   * @param handler - Function invoked for every emitted event.
   * @returns An {@link EventUnsubscriber} function to remove the subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = eventBus.subscribe((event) => {
   *   console.log('Received event:', event);
   * });
   * ```
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
   * Removes a previously registered event handler.
   *
   * @remarks
   * If the handler was not subscribed, this operation does nothing.
   *
   * @param handler - The handler function instance to remove.
   */
  public unsubscribe(handler: EventHandler): void {
    dbg.info(prefix(__filename), "Removing event subscription:", {
      handler,
      bus: this,
    });

    this.handlers.delete(handler);
  }

  /**
   * Checks if the bus has any active subscribers.
   *
   * @returns `true` if at least one handler is registered, `false` otherwise.
   */
  public has(): boolean {
    return this.handlers.size > 0;
  }

  /**
   * Removes all registered handlers from the bus.
   *
   * @internal
   */
  public clear(): void {
    this.handlers.clear();
  }
}
