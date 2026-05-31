import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../alias";
import { reportWirestateInternalError } from "../error/internal-error-handler";
import { EventEmitOptions, EventHandler, EventType, EventUnsubscriber, WireEvent } from "../types/events";
import { Maybe, Optional } from "../types/general";

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
  /**
   * Handlers subscribed to every event regardless of type.
   */
  private readonly allHandlers: Set<EventHandler> = new Set();

  /**
   * Handlers indexed by the event type they subscribed to.
   */
  private readonly typedHandlers: Map<EventType, Set<EventHandler>> = new Map();

  public constructor(private readonly container?: Container) {}

  /**
   * Broadcasts an event to all subscribers.
   *
   * @remarks
   * Each bucket is snapshotted before dispatch, so a handler can subscribe or unsubscribe while
   * an event is being emitted. A thrown handler is logged and the next handler
   * still runs. Catch-all handlers run before type-specific ones.
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
    const event: WireEvent<P, T, F> = { type };

    if (payload !== undefined) {
      (event as { payload: P }).payload = payload;
    }

    if (options?.from !== undefined) {
      (event as { from: F }).from = options.from;
    }

    // Snapshot each bucket so handlers may subscribe or unsubscribe during emit.
    if (this.allHandlers.size) {
      this.dispatch(Array.from(this.allHandlers), event);
    }

    const typedHandlers: Optional<Set<EventHandler>> = this.typedHandlers.get(type) ?? null;

    if (typedHandlers) {
      this.dispatch(Array.from(typedHandlers), event);
    }
  }

  /**
   * Subscribes to every event.
   *
   * @param handler - Event handler invoked for every emitted event.
   * @returns Function that removes this subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = eventBus.subscribe((event) => {
   *   console.log("Received event:", event);
   * });
   * ```
   */
  public subscribe(handler: EventHandler): EventUnsubscriber;

  /**
   * Subscribes to one or more event types.
   *
   * @remarks
   * The handler is indexed by type, so it is only invoked for matching events.
   * Pass `null` to subscribe to every event. An empty array never matches.
   *
   * @param types - Event type, list of event types, or `null` for every event.
   * @param handler - Event handler invoked for matching events.
   * @returns Function that removes this subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = eventBus.subscribe(["USER_ADDED", "USER_REMOVED"], (event) => {
   *   refreshList();
   * });
   * ```
   */
  public subscribe(types: Optional<EventType | ReadonlyArray<EventType>>, handler: EventHandler): EventUnsubscriber;

  public subscribe(
    typesOrHandler: EventHandler | Optional<EventType | ReadonlyArray<EventType>>,
    handler?: EventHandler
  ): EventUnsubscriber {
    // Resolve the overloads: a single function argument is a catch-all handler.
    const resolvedHandler: EventHandler = handler ?? (typesOrHandler as EventHandler);
    const types: Optional<EventType | ReadonlyArray<EventType>> =
      handler === undefined ? null : (typesOrHandler as Optional<EventType | ReadonlyArray<EventType>>);

    dbg.info(prefix(__filename), "Adding event subscription:", {
      handler: resolvedHandler,
      types,
      bus: this,
    });

    if (types === null) {
      this.allHandlers.add(resolvedHandler);

      return () => this.allHandlers.delete(resolvedHandler);
    }

    // Index the handler under each distinct type so dispatch can find it by key.
    const registered: Array<EventType> = [];

    for (const type of new Set(Array.isArray(types) ? types : [types])) {
      let bucket: Maybe<Set<EventHandler>> = this.typedHandlers.get(type);

      if (!bucket) {
        bucket = new Set();
        this.typedHandlers.set(type, bucket);
      }

      bucket.add(resolvedHandler);
      registered.push(type);
    }

    return () => {
      for (const type of registered) {
        this.removeFromBucket(type, resolvedHandler);
      }
    };
  }

  /**
   * Removes a previously registered event handler.
   *
   * @remarks
   * Removes the handler from the catch-all set and every type bucket it was
   * registered under. If the handler was not subscribed, this does nothing.
   *
   * @param handler - The handler function instance to remove.
   */
  public unsubscribe(handler: EventHandler): void {
    dbg.info(prefix(__filename), "Removing event subscription:", {
      handler,
      bus: this,
    });

    this.allHandlers.delete(handler);

    for (const type of this.typedHandlers.keys()) {
      this.removeFromBucket(type, handler);
    }
  }

  /**
   * Checks if the bus has any active subscribers.
   *
   * @returns `true` if at least one handler is registered, `false` otherwise.
   */
  public hasSubscribers(): boolean {
    return this.allHandlers.size > 0 || this.typedHandlers.size > 0;
  }

  /**
   * Removes all registered handlers from the bus.
   *
   * @internal
   */
  public clear(): void {
    this.allHandlers.clear();
    this.typedHandlers.clear();
  }

  /**
   * Removes a handler from a type bucket and drops the bucket once it is empty.
   *
   * @param type - Event type bucket to update.
   * @param handler - Handler to remove.
   */
  private removeFromBucket(type: EventType, handler: EventHandler): void {
    const bucket: Maybe<Set<EventHandler>> = this.typedHandlers.get(type);

    if (bucket && bucket.delete(handler) && bucket.size === 0) {
      this.typedHandlers.delete(type);
    }
  }

  /**
   * Invokes a snapshot of handlers, isolating individual handler failures.
   *
   * @param handlers - Snapshot of handlers to invoke.
   * @param event - Event passed to each handler.
   */
  private dispatch(handlers: ReadonlyArray<EventHandler>, event: WireEvent): void {
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        // Prevent one failing listener from stalling the entire bus.
        reportWirestateInternalError({
          container: this.container,
          error,
          event,
          message: "Event handler threw",
          source: "event-handler",
        });
      }
    }
  }
}
