import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "../types/events";

/**
 * Broadcasts events to every subscriber in one container.
 *
 * @remarks
 * Events are fire-and-forget. No handler owns the result because there is no
 * result. Use them for "this happened" notifications.
 *
 * @group Events
 *
 * @example
 * ```typescript
 * import { EventBus, createContainer } from "@wirestate/core";
 *
 * const container = createContainer();
 * const bus = container.get(EventBus);
 * const unsubscribe = bus.subscribe((event) => console.log(event.type));
 *
 * bus.emit("USER_LOGGED_IN", { userId: "u1" });
 * unsubscribe();
 * ```
 */
export class EventBus {
  private readonly handlers: Set<EventHandler> = new Set();

  /**
   * Broadcasts an event to all subscribers.
   *
   * @remarks
   * The bus snapshots subscribers before dispatch. A handler can unsubscribe
   * while an event is being emitted. A thrown handler is logged and the next
   * handler still runs.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event identifier.
   * @template F - Type of the event source.
   *
   * @param type - Event token.
   * @param payload - Event payload.
   * @param options - Event emission options.
   *
   * @example
   * ```typescript
   * eventBus.emit("USER_LOGGED_IN", { userId: "123" }, { from: authService });
   * ```
   */
  public emit<P = unknown, T extends EventType = EventType, F = unknown>(
    type: T,
    payload?: P,
    options?: EventEmitOptions<F>
  ): void {
    // Snapshot prevents concurrent modification errors if handlers sub/unsub during emit.
    const snapshot: Array<EventHandler> = Array.from(this.handlers);

    for (const handler of snapshot) {
      try {
        const event: WireEvent<P, T, F> = {
          type,
        };

        if (payload !== undefined) {
          (event as { payload: P }).payload = payload;
        }

        if (options?.from !== undefined) {
          (event as { from: F }).from = options.from;
        }

        handler(event);
      } catch (error) {
        // Prevent one failing listener from stalling the entire bus.
        console.error("[wirestate] Event handler threw:", error);
      }
    }
  }

  /**
   * Subscribes to every event.
   *
   * @param handler - Event handler.
   * @returns Function that removes this subscription.
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
