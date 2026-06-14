import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container } from "../../container/container";
import { inject } from "../../container/container-context";
import { reportWirestateInternalError } from "../../error/internal-error-handler";
import { Injectable } from "../../metadata/metadata-injectable";
import type { Definable, Maybe, Optional } from "../../types/general";

import type { EventEmitOptions, EventHandler, EventType, EventUnsubscribe, WireEvent } from "./events";

/**
 * Private key under which catch-all handlers are stored.
 *
 * @remarks
 * A module-private symbol, so it can never collide with a user event type.
 */
const ALL_EVENTS_TYPE: unique symbol = Symbol("@wirestate/core/event-bus/all-events");

/**
 * A single event subscription.
 *
 * @remarks
 * Each `subscribe` call creates exactly one, giving every subscription a stable
 * identity. The returned unsubscriber removes this object specifically, so
 * subscriptions that share the same handler function are tracked and torn down
 * independently.
 *
 * @group Events
 * @internal
 */
interface EventSubscription {
  readonly handler: EventHandler;
}

/**
 * Broadcasts events to every subscriber registered on one container bus.
 *
 * @remarks
 * Events are fire-and-forget "this happened" notifications.
 *
 * @group Events
 *
 * @example
 * ```typescript
 * import { Container, EventBus, EventsPlugin } from "@wirestate/core";
 *
 * const container = new Container({ plugins: [new EventsPlugin()] });
 * const bus = container.get(EventBus);
 * const unsubscribe = bus.subscribe((event) => console.log(event.type));
 *
 * bus.emit("USER_LOGGED_IN", { userId: "u1" });
 * unsubscribe();
 * ```
 */
@Injectable()
export class EventBus {
  /**
   * Subscriptions indexed by event type.
   */
  private readonly handlers: Map<EventType, Set<EventSubscription>> = new Map();

  public constructor(private readonly container: Definable<Container> = inject(Container, { optional: true })) {}

  /**
   * Emits an event to matching subscribers.
   *
   * @remarks
   * Handlers are snapshotted before dispatch, so subscriptions can change while
   * an event is being emitted. If a handler throws, Wirestate reports it through
   * the container error handler and continues with the next subscriber.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event.
   * @template S - Type of the event source.
   *
   * @param type - Event token.
   * @param payload - Event payload.
   * @param options - Event emission options.
   *
   * @example
   * ```typescript
   * eventBus.emit("USER_LOGGED_IN", { userId: "123" }, { source: authService });
   * ```
   */
  public emit<P = unknown, T extends EventType = EventType, S = unknown>(
    type: T,
    payload?: P,
    options?: EventEmitOptions<S>
  ): void {
    const event: WireEvent<P, T, S> = { type };

    if (payload !== undefined) {
      (event as { payload: P }).payload = payload;
    }

    if (options?.source !== undefined) {
      (event as { source: S }).source = options.source;
    }

    dbg.info(prefix(__filename), "Emit event:", { event });

    // Snapshot each bucket so subscriptions may change during emit.
    // Catch-all subscriptions run before type-specific ones.
    const allEventsSubscriptions: Maybe<Set<EventSubscription>> = this.handlers.get(ALL_EVENTS_TYPE);

    if (allEventsSubscriptions) {
      this.dispatch(Array.from(allEventsSubscriptions), event);
    }

    const typedSubscriptions: Maybe<Set<EventSubscription>> = this.handlers.get(type);

    if (typedSubscriptions) {
      this.dispatch(Array.from(typedSubscriptions), event);
    }
  }

  /**
   * Subscribes to every event on this bus.
   *
   * @param handler - Event handler invoked for every emitted event.
   * @returns Function that removes this subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscribe = eventBus.subscribe((event) => {
   *   console.log("Received event:", event);
   * });
   * ```
   */
  public subscribe(handler: EventHandler): EventUnsubscribe;

  /**
   * Subscribes to one or more event types.
   *
   * @remarks
   * Pass `null` to subscribe to every event. Each call is independent:
   * subscribing the same function twice delivers the event twice, and each
   * returned unsubscriber removes only its own subscription.
   *
   * @param types - Event type, list of event types, or `null` for every event.
   * @param handler - Event handler invoked for matching events.
   * @returns Function that removes this subscription.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscribe = eventBus.subscribe(["USER_ADDED", "USER_REMOVED"], (event) => {
   *   refreshList();
   * });
   * ```
   */
  public subscribe(types: Optional<EventType | ReadonlyArray<EventType>>, handler: EventHandler): EventUnsubscribe;

  public subscribe(
    typesOrHandler: EventHandler | Optional<EventType | ReadonlyArray<EventType>>,
    handler?: EventHandler
  ): EventUnsubscribe {
    // Resolve the overloads: a single function argument is a catch-all handler.
    const resolvedHandler: EventHandler = handler ?? (typesOrHandler as EventHandler);
    const types: Optional<EventType | ReadonlyArray<EventType>> =
      handler === undefined ? null : (typesOrHandler as Optional<EventType | ReadonlyArray<EventType>>);

    dbg.info(prefix(__filename), "Adding event subscription:", {
      handler: resolvedHandler,
      types,
      bus: this,
    });

    // One subscription identity is shared across every bucket it registers in,
    // so the returned unsubscriber removes exactly this subscription and nothing
    // that another call registered for the same handler.
    const subscription: EventSubscription = { handler: resolvedHandler };
    const registered: Array<EventType> = [];

    for (const key of this.resolveKeys(types)) {
      let bucket: Maybe<Set<EventSubscription>> = this.handlers.get(key);

      if (!bucket) {
        bucket = new Set();
        this.handlers.set(key, bucket);
      }

      bucket.add(subscription);
      registered.push(key);
    }

    return () => {
      for (const key of registered) {
        this.removeSubscription(key, subscription);
      }
    };
  }

  /**
   * Removes one of a handler's catch-all subscriptions.
   *
   * @remarks
   * Prefer the unsubscriber returned by {@link subscribe}. This by-reference form
   * removes the newest catch-all subscription that uses the handler.
   *
   * @param handler - The handler function instance to remove.
   */
  public unsubscribe(handler: EventHandler): void;

  /**
   * Removes one of a handler's subscriptions for one or more event types.
   *
   * @remarks
   * For each given type, removes the newest subscription that uses the handler.
   * Pass `null` to target catch-all subscriptions.
   *
   * @param types - Event type, list of event types, or `null` for catch-all.
   * @param handler - The handler function instance to remove.
   */
  public unsubscribe(types: Optional<EventType | ReadonlyArray<EventType>>, handler: EventHandler): void;

  public unsubscribe(
    typesOrHandler: EventHandler | Optional<EventType | ReadonlyArray<EventType>>,
    handler?: EventHandler
  ): void {
    // Resolve the overloads: a single function argument targets catch-all.
    const resolvedHandler: EventHandler = handler ?? (typesOrHandler as EventHandler);
    const types: Optional<EventType | ReadonlyArray<EventType>> =
      handler === undefined ? null : (typesOrHandler as Optional<EventType | ReadonlyArray<EventType>>);

    dbg.info(prefix(__filename), "Removing event subscription:", {
      handler: resolvedHandler,
      types,
      bus: this,
    });

    for (const key of this.resolveKeys(types)) {
      this.removeByHandler(key, resolvedHandler);
    }
  }

  /**
   * Checks if the bus has any active subscribers.
   *
   * @returns `true` if at least one handler is registered, `false` otherwise.
   */
  public hasSubscribers(): boolean {
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

  /**
   * Resolves the bucket keys a subscription targets.
   *
   * @remarks
   * `null` (catch-all) maps to the private {@link ALL_EVENTS_TYPE} key. Types are
   * deduplicated so one call registers a subscription once per distinct type.
   *
   * @param types - Event type, list of event types, or `null` for catch-all.
   * @returns The distinct bucket keys.
   */
  private resolveKeys(types: Optional<EventType | ReadonlyArray<EventType>>): Set<EventType> {
    if (types === null) {
      return new Set<EventType>([ALL_EVENTS_TYPE]);
    }

    return new Set<EventType>(Array.isArray(types) ? types : [types]);
  }

  /**
   * Removes one subscription from a bucket and drops the bucket once it is empty.
   *
   * @param key - Event type, or the {@link ALL_EVENTS_TYPE} key, whose bucket to update.
   * @param subscription - The subscription instance to remove.
   */
  private removeSubscription(key: EventType, subscription: EventSubscription): void {
    const bucket: Maybe<Set<EventSubscription>> = this.handlers.get(key);

    if (bucket && bucket.delete(subscription) && bucket.size === 0) {
      this.handlers.delete(key);
    }
  }

  /**
   * Removes a single subscription that uses a handler from a bucket and drops the bucket once it is empty.
   *
   * @param key - Event type, or the {@link ALL_EVENTS_TYPE} key, whose bucket to update.
   * @param handler - Handler whose subscription to remove.
   */
  private removeByHandler(key: EventType, handler: EventHandler): void {
    const bucket: Maybe<Set<EventSubscription>> = this.handlers.get(key);

    if (!bucket) {
      return;
    }

    // Sets iterate in insertion order, so the last match is the newest.
    let match: Maybe<EventSubscription>;

    for (const subscription of bucket) {
      if (subscription.handler === handler) {
        match = subscription;
      }
    }

    if (match && bucket.delete(match) && bucket.size === 0) {
      this.handlers.delete(key);
    }
  }

  /**
   * Invokes a snapshot of subscriptions, isolating individual handler failures.
   *
   * @param subscriptions - Snapshot of subscriptions to invoke.
   * @param event - Event passed to each handler.
   */
  private dispatch(subscriptions: ReadonlyArray<EventSubscription>, event: WireEvent): void {
    for (const subscription of subscriptions) {
      try {
        subscription.handler(event);
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
