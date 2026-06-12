import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Identifier } from "../binding/binding-tokens";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { Injectable } from "../metadata/injectable";
import { QueryBus } from "../queries/query-bus";
import { CommandHandler, CommandUnregister, CommandType } from "../types/commands";
import { EventEmitOptions, EventHandler, EventType, EventUnsubscriber } from "../types/events";
import { Optional, AnyObject } from "../types/general";
import { QueryHandler, QueryUnregister, QueryType } from "../types/queries";
import { SeedKey, SeedsMap } from "../types/seeds";

import type { Container } from "./container";
import { SEED_TOKEN, SEEDS_TOKEN } from "./seeds";

/**
 * Per-instance handle for container work.
 *
 * @remarks
 * Inject `WireScope` when a service needs buses, seeds, or lazy resolution.
 * Each bound instance gets its own transient scope.
 *
 * @group Container
 *
 * @example
 * ```typescript
 * import { Injectable, WireScope, inject } from "@wirestate/core";
 *
 * @Injectable()
 * class CartService {
 *   public constructor(private readonly scope: WireScope = inject(WireScope)) {}
 *
 *   public addItem(item: CartItem): void {
 *     this.scope.emitEvent("CART_ITEM_ADDED", item);
 *   }
 * }
 * ```
 */
@Injectable()
export class WireScope {
  /**
   * Container-scoped command bus used by command helper methods.
   */
  private readonly commandBus: CommandBus;

  /**
   * Container-scoped event bus used by event helper methods.
   */
  private readonly eventBus: EventBus;

  /**
   * Container-scoped query bus used by query helper methods.
   */
  private readonly queryBus: QueryBus;

  /**
   * Creates a scope for a container.
   *
   * @param container - Owner container of the scope.
   * @internal
   */
  public constructor(private readonly container: Container) {
    this.commandBus = container.get(CommandBus);
    this.eventBus = container.get(EventBus);
    this.queryBus = container.get(QueryBus);
  }

  /**
   * Resolves an instance or value from the container.
   *
   * @remarks
   * Use this for lazy work or to reduce direct constructor dependencies.
   * Constructor injection resolves dependencies during instance creation;
   * `resolve` looks up a dependency later, only when the method is called.
   *
   * @template T - Type of the instance or value to resolve.
   *
   * @param token - The token (class constructor, symbol, or string).
   * @returns The resolved instance or value.
   *
   * @throws {Error} If the token cannot be resolved from the container.
   *
   * @example
   * ```typescript
   * const service: MyService = scope.resolve(MyService);
   * ```
   */
  public resolve<T>(token: Identifier<T>): T {
    dbg.info(prefix(__filename), "Lazy resolve:", {
      name: (token as AnyObject)?.name ?? token,
      token,
    });

    return this.container.get<T>(token);
  }

  /**
   * Lazily resolves an instance if it is bound, otherwise returns null.
   *
   * @template T - Type of the instance or value to resolve.
   *
   * @param token - Service token (class constructor, symbol, or string).
   * @returns The resolved instance, value, or `null` if not bound.
   *
   * @example
   * ```typescript
   * const logger: Logger | null = scope.resolveOptional(Logger);
   *
   * logger?.info("Resolved optionally");
   * ```
   */
  public resolveOptional<T>(token: Identifier<T>): Optional<T> {
    dbg.info(prefix(__filename), "Lazy optional resolve:", {
      name: (token as AnyObject)?.name ?? token,
      token,
    });

    return this.container.has(token) ? this.container.get<T>(token) : null;
  }

  /**
   * Dispatches an event to the {@link EventBus}.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event identifier.
   * @template S - Type of the event source.
   *
   * @param type - Event identifier.
   * @param payload - Optional event payload.
   * @param options - Event emission options.
   *
   * @example
   * ```typescript
   * scope.emitEvent("VALUE_CHANGED", { value: "abcd" });
   * ```
   */
  public emitEvent<P, T extends EventType = EventType, S = unknown>(
    type: T,
    payload?: P,
    options?: EventEmitOptions<S>
  ): void {
    this.eventBus.emit(type, payload, options);
  }

  /**
   * Subscribes to all events on the {@link EventBus}.
   *
   * @param handler - Function called for every emitted event.
   * @returns A function to unsubscribe.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = scope.subscribeToEvent((event) => {
   *   console.log("Event received:", event);
   * });
   * ```
   */
  public subscribeToEvent(handler: EventHandler): EventUnsubscriber;

  /**
   * Subscribes to one or more event types on the {@link EventBus}.
   *
   * @remarks
   * The handler is indexed by type, so it is only called for matching events.
   * Pass `null` to subscribe to every event.
   *
   * @param types - Event type, list of event types, or `null` for every event.
   * @param handler - Function called for matching events.
   * @returns A function to unsubscribe.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = scope.subscribeToEvent("USER_LOGGED_IN", (event) => {
   *   console.log("User logged in:", event);
   * });
   * ```
   */
  public subscribeToEvent(
    types: Optional<EventType | ReadonlyArray<EventType>>,
    handler: EventHandler
  ): EventUnsubscriber;

  public subscribeToEvent(
    typesOrHandler: EventHandler | Optional<EventType | ReadonlyArray<EventType>>,
    handler?: EventHandler
  ): EventUnsubscriber {
    return handler
      ? this.eventBus.subscribe(typesOrHandler as Optional<EventType | ReadonlyArray<EventType>>, handler)
      : this.eventBus.subscribe(typesOrHandler as EventHandler);
  }

  /**
   * Removes one of a handler's catch-all subscriptions from the {@link EventBus}.
   *
   * @remarks
   * Prefer the unsubscriber returned by {@link subscribeToEvent}. This
   * by-reference form removes the most recently added catch-all subscription
   * using the handler (one per call).
   *
   * @param handler - The handler instance to remove.
   *
   * @example
   * ```typescript
   * scope.unsubscribeFromEvent(this.onEvent);
   * ```
   */
  public unsubscribeFromEvent(handler: EventHandler): void;

  /**
   * Removes one of a handler's subscriptions per event type from the {@link EventBus}.
   *
   * @param types - Event type, list of event types, or `null` for catch-all.
   * @param handler - The handler instance to remove.
   *
   * @example
   * ```typescript
   * scope.unsubscribeFromEvent("USER_LOGGED_IN", this.onEvent);
   * ```
   */
  public unsubscribeFromEvent(types: Optional<EventType | ReadonlyArray<EventType>>, handler: EventHandler): void;

  public unsubscribeFromEvent(
    typesOrHandler: EventHandler | Optional<EventType | ReadonlyArray<EventType>>,
    handler?: EventHandler
  ): void {
    if (handler) {
      this.eventBus.unsubscribe(typesOrHandler as Optional<EventType | ReadonlyArray<EventType>>, handler);
    } else {
      this.eventBus.unsubscribe(typesOrHandler as EventHandler);
    }
  }

  /**
   * Dispatches a query and returns the handler result as-is.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param payload - Payload for the query handler.
   * @returns The query result.
   *
   * @throws {@link WirestateError} If no query handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = scope.query("GET_USER", { id: 1 });
   * ```
   */
  public query<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): R {
    return this.queryBus.query<R, P, T>(type, payload);
  }

  /**
   * Dispatches a query and returns the result as a Promise.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param payload - Payload for the query handler.
   * @returns A Promise resolving to the query result.
   *
   * @throws {@link WirestateError} If no query handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = await scope.queryAsync("GET_USER", { id: 1 });
   * ```
   */
  public queryAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): Promise<R> {
    return this.queryBus.queryAsync<R, P, T>(type, payload);
  }

  /**
   * Dispatches a query and returns the handler result as-is, or null if no handler is registered.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param payload - Payload for the query handler.
   * @returns The query result or `null`.
   *
   * @example
   * ```typescript
   * const config: Config | null = scope.queryOptional("GET_CONFIG");
   * ```
   */
  public queryOptional<R = unknown, P = unknown, T extends QueryType = QueryType>(type: T, payload?: P): Optional<R> {
    return this.queryBus.queryOptional<R, P, T>(type, payload);
  }

  /**
   * Dispatches a query and returns the result as a Promise, or null if no handler is registered.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param payload - Payload for the query handler.
   * @returns A Promise resolving to the query result or `null`.
   *
   * @example
   * ```typescript
   * const config: Config | null = await scope.queryOptionalAsync("GET_CONFIG");
   * ```
   */
  public queryOptionalAsync<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    payload?: P
  ): Promise<Optional<R>> {
    return this.queryBus.queryOptionalAsync<R, P, T>(type, payload);
  }

  /**
   * Registers a handler for a specific query type.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param handler - The handler function.
   * @returns A function to unregister the handler.
   *
   * @example
   * ```typescript
   * scope.registerQueryHandler("GET_DATE_NOW", () => new Date());
   * ```
   */
  public registerQueryHandler<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    handler: QueryHandler<R, P, T>
  ): QueryUnregister {
    return this.queryBus.register<R, P, T>(type, handler);
  }

  /**
   * Removes a specific query handler registration.
   *
   * @template R - Type of the query result.
   * @template P - Type of the query payload.
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param handler - The handler instance to remove.
   *
   * @example
   * ```typescript
   * scope.unregisterQueryHandler("GET_DATE_NOW", this.onGetDateNow);
   * ```
   */
  public unregisterQueryHandler<R = unknown, P = unknown, T extends QueryType = QueryType>(
    type: T,
    handler: QueryHandler<R, P, T>
  ): void {
    this.queryBus.unregister<R, P, T>(type, handler);
  }

  /**
   * Dispatches a command and returns the handler result as-is.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Payload for the command.
   * @returns The command result.
   *
   * @throws {@link WirestateError} If no command handler is registered.
   *
   * @example
   * ```typescript
   * scope.executeCommand("LOGOUT");
   * ```
   */
  public executeCommand<R = unknown, P = unknown, T extends CommandType = CommandType>(type: T, payload?: P): R {
    return this.commandBus.execute<R, P, T>(type, payload);
  }

  /**
   * Dispatches a command and returns the result as a Promise.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Payload for the command.
   * @returns A Promise resolving to the command result.
   *
   * @throws {@link WirestateError} If no command handler is registered.
   *
   * @example
   * ```typescript
   * await scope.executeCommandAsync("LOGOUT");
   * ```
   */
  public executeCommandAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Promise<R> {
    return this.commandBus.executeAsync<R, P, T>(type, payload);
  }

  /**
   * Dispatches a command if a handler is registered, otherwise returns null.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Payload for the command.
   * @returns The command result or `null`.
   *
   * @example
   * ```typescript
   * scope.executeOptionalCommand("CLEANUP_CACHE");
   * ```
   */
  public executeOptionalCommand<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Optional<R> {
    return this.commandBus.executeOptional<R, P, T>(type, payload);
  }

  /**
   * Dispatches an optional command and returns the result as a Promise.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param payload - Payload for the command.
   * @returns A Promise resolving to the command result or `null`.
   *
   * @example
   * ```typescript
   * const result: string | null = await scope.executeOptionalCommandAsync("CLEANUP_CACHE");
   * ```
   */
  public executeOptionalCommandAsync<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    payload?: P
  ): Promise<Optional<R>> {
    return this.commandBus.executeOptionalAsync<R, P, T>(type, payload);
  }

  /**
   * Registers a handler for a specific command type.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param handler - The handler function.
   * @returns A function to unregister the handler.
   *
   * @example
   * ```typescript
   * scope.registerCommandHandler("LOG_ERROR", (error) => {
   *   console.error(error);
   * });
   * ```
   */
  public registerCommandHandler<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    handler: CommandHandler<R, P, T>
  ): CommandUnregister {
    return this.commandBus.register<R, P, T>(type, handler);
  }

  /**
   * Removes a specific command handler registration.
   *
   * @template R - Type of the command result.
   * @template P - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param handler - The handler instance to remove.
   *
   * @example
   * ```typescript
   * scope.unregisterCommandHandler("LOG_ERROR", this.handleLogError);
   * ```
   */
  public unregisterCommandHandler<R = unknown, P = unknown, T extends CommandType = CommandType>(
    type: T,
    handler: CommandHandler<R, P, T>
  ): void {
    this.commandBus.unregister<R, P, T>(type, handler);
  }

  /**
   * Reads the shared seed object.
   *
   * @remarks
   * Call without a key to get the one shared seed for this container.
   *
   * @template T - Expected type of the shared seed object.
   *
   * @returns The shared seed object.
   *
   * @example
   * ```typescript
   * interface ApplicationSeed {
   *   apiUrl: string;
   * }
   *
   * const seed: ApplicationSeed = scope.getSeed();
   * ```
   */
  public getSeed<T extends AnyObject>(): T;

  /**
   * Reads a targeted seed value.
   *
   * @remarks
   * Targeted seeds are keyed by class, string, or symbol.
   *
   * @template T - Expected type of the seed value.
   *
   * @param seed - Lookup token for the seed.
   * @returns The seed value or `null` if not found.
   *
   * @example
   * ```typescript
   * const apiUrl = scope.getSeed<string>("API_URL");
   * ```
   */
  public getSeed<T>(seed: SeedKey): Optional<T>;

  public getSeed<T>(seed?: SeedKey): Optional<T> {
    dbg.info(prefix(__filename), "Get seed for key:", {
      key: (seed as AnyObject)?.name ?? seed,
    });

    if (seed === undefined) {
      return this.container.get<T>(SEED_TOKEN);
    } else {
      const seeds: SeedsMap = this.container.get<SeedsMap>(SEEDS_TOKEN);

      return seeds.has(seed) ? (seeds.get(seed) as T) : null;
    }
  }
}
