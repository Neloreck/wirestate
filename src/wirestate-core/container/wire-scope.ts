import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Injectable, Container, ServiceIdentifier } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { ERROR_CODE_ACCESS_AFTER_DISPOSAL, ERROR_CODE_ACCESS_BEFORE_ACTIVATION } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../registry";
import { CommandHandler, CommandUnregister, CommandType } from "../types/commands";
import { EventEmitOptions, EventHandler, EventType, EventUnsubscriber } from "../types/events";
import { Optional, AnyObject } from "../types/general";
import { QueryHandler, QueryUnregister, QueryType } from "../types/queries";
import { SeedKey, SeedsMap } from "../types/seeds";

/**
 * Per-service handle for container work.
 *
 * @remarks
 * Inject `WireScope` when a service needs buses, seeds, or lazy resolution.
 *
 * Each bound service gets its own transient scope. The scope is valid after
 * service activation and before deactivation. After disposal it throws instead
 * of letting dead services keep talking to the container.
 *
 * @group Container
 *
 * @example
 * ```typescript
 * import { Inject, Injectable, WireScope } from "@wirestate/core";
 *
 * @Injectable()
 * class CartService {
 *   public constructor(@Inject(WireScope) private readonly scope: WireScope) {}
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
   * Whether the scope was deactivated and disposed from the container.
   *
   * @remarks
   * This becomes `true` after service deactivation, usually when an owned
   * container is disposed. It remains `false` when only provider ownership ends.
   */
  public readonly isDisposed: boolean = false;

  /**
   * Whether the scope has been removed from provider ownership.
   *
   * @remarks
   * `null` means the scope has not reached a provider provision cycle yet.
   * `false` means the scope is currently owned by a provider. `true` means the
   * provider deprovisioned it.
   */
  public readonly isDeprovisioned: Optional<boolean> = null;

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

  public constructor(private readonly container: Container) {
    this.commandBus = container.get(CommandBus);
    this.eventBus = container.get(EventBus);
    this.queryBus = container.get(QueryBus);
  }

  /**
   * Whether this scope should stop user work because its service or provider lifecycle ended.
   *
   * @remarks
   * Use this as the default async-work guard. It is `true` when either
   * {@link isDisposed} is `true` or {@link isDeprovisioned} is `true`.
   *
   * @returns True when the scope was disposed or fully deprovisioned.
   */
  public get isInactive(): boolean {
    return this.isDisposed || this.isDeprovisioned === true;
  }

  /**
   * Resolves a service or value from the container.
   *
   * @remarks
   * Use this for lazy work or to soften a circular dependency. Constructor
   * injection is a handshake at startup; `resolve` is knocking only when you
   * actually need the other service.
   *
   * @template T - Type of the service or value to resolve.
   *
   * @param token - Service token (class constructor, symbol, or string).
   * @returns The resolved instance or value.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {Error} If the service cannot be resolved from the container.
   *
   * @example
   * ```typescript
   * const service: MyService = scope.resolve(MyService);
   * ```
   */
  public resolve<T>(token: ServiceIdentifier<T>): T {
    dbg.info(prefix(__filename), "Lazy resolve:", {
      name: (token as AnyObject)?.name ?? token,
      token,
    });

    this.assertActive();

    return this.container.get<T>(token);
  }

  /**
   * Lazily resolves a service if it is bound, otherwise returns null.
   *
   * @template T - Type of the service or value to resolve.
   *
   * @param token - Service token (class constructor, symbol, or string).
   * @returns The resolved instance, value, or `null` if not bound.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const logger: Logger | null = scope.resolveOptional(Logger);
   *
   * logger?.info("Resolved optionally");
   * ```
   */
  public resolveOptional<T>(token: ServiceIdentifier<T>): Optional<T> {
    dbg.info(prefix(__filename), "Lazy optional resolve:", {
      name: (token as AnyObject)?.name ?? token,
      token,
    });

    this.assertActive();

    return this.container.isBound(token) ? this.container.get<T>(token) : null;
  }

  /**
   * Dispatches an event to the {@link EventBus}.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event identifier.
   *
   * @param type - Event identifier.
   * @param payload - Optional data associated with the event.
   * @param options - Event emission options.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.emitEvent("VALUE_CHANGED", { value: "abcd" });
   * ```
   */
  public emitEvent<P, T extends EventType = EventType, F = unknown>(
    type: T,
    payload?: P,
    options?: EventEmitOptions<F>
  ): void {
    dbg.info(prefix(__filename), "Emit event:", {
      type,
      payload,
      options,
    });

    this.assertActive();

    this.eventBus.emit(type, payload, options);
  }

  /**
   * Subscribes to all events on the {@link EventBus}.
   *
   * @param handler - Function called for every emitted event.
   * @returns A function to unsubscribe.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const unsubscribe: EventUnsubscriber = scope.subscribeToEvent((event) => {
   *   console.log("Event received:", event);
   * });
   * ```
   */
  public subscribeToEvent(handler: EventHandler): EventUnsubscriber {
    dbg.info(prefix(__filename), "Subscribe event:", { handler });

    this.assertActive();

    return this.eventBus.subscribe(handler);
  }

  /**
   * Unsubscribes a specific handler from the {@link EventBus}.
   *
   * @param handler - The handler instance to remove.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.unsubscribeFromEvent(this.onEvent);
   * ```
   */
  public unsubscribeFromEvent(handler: EventHandler): void {
    dbg.info(prefix(__filename), "Unsubscribe event:", { handler });

    this.assertActive();

    this.eventBus.unsubscribe(handler);
  }

  /**
   * Dispatches a query and returns the handler result as-is.
   *
   * @template R - Type of the query result.
   * @template D - Type of the query data (payload).
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param data - Input data for the query handler.
   * @returns The query result.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no query handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = scope.query("GET_USER", { id: 1 });
   * ```
   */
  public query<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): R {
    dbg.info(prefix(__filename), "Query:", { type, data });

    this.assertActive();

    return this.queryBus.query<R, D>(type, data);
  }

  /**
   * Dispatches a query and returns the result as a Promise.
   *
   * @template R - Type of the query result.
   * @template D - Type of the query data (payload).
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param data - Input data for the query handler.
   * @returns A Promise resolving to the query result.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no query handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = await scope.queryAsync("GET_USER", { id: 1 });
   * ```
   */
  public queryAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Promise<R> {
    dbg.info(prefix(__filename), "Async query:", { type, data });

    this.assertActive();

    return this.queryBus.queryAsync<R, D>(type, data);
  }

  /**
   * Dispatches a synchronous query and returns the result, or null if no handler is registered.
   *
   * @template R - Type of the query result.
   * @template D - Type of the query data (payload).
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param data - Input data for the query handler.
   * @returns The query result or `null`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const config: Config | null = scope.queryOptional("GET_CONFIG");
   * ```
   */
  public queryOptional<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Optional<R> {
    dbg.info(prefix(__filename), "Query optional:", { type, data });

    this.assertActive();

    return this.queryBus.queryOptional<R, D>(type, data);
  }

  /**
   * Dispatches a query and returns the result as a Promise, or null if no handler is registered.
   *
   * @template R - Type of the query result.
   * @template D - Type of the query data (payload).
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param data - Input data for the query handler.
   * @returns A Promise resolving to the query result or `null`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const config: Config | null = await scope.queryOptionalAsync("GET_CONFIG");
   * ```
   */
  public queryOptionalAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Promise<Optional<R>> {
    dbg.info(prefix(__filename), "Optional async query:", { type, data });

    this.assertActive();

    return this.queryBus.queryOptionalAsync<R, D>(type, data);
  }

  /**
   * Registers a handler for a specific query type.
   *
   * @template D - Type of the query data (payload).
   * @template R - Type of the query result.
   *
   * @param type - Query identifier.
   * @param handler - The handler function.
   * @returns A function to unregister the handler.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.registerQueryHandler("GET_DATE_NOW", () => new Date());
   * ```
   */
  public registerQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): QueryUnregister {
    dbg.info(prefix(__filename), "Register query handler:", { type });

    this.assertActive();

    return this.queryBus.register(type, handler);
  }

  /**
   * Removes a specific query handler registration.
   *
   * @template D - Type of the query data (payload).
   * @template R - Type of the query result.
   *
   * @param type - Query identifier.
   * @param handler - The handler instance to remove.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.unregisterQueryHandler("GET_DATE_NOW", this.onGetDateNow);
   * ```
   */
  public unregisterQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregister query:", { type });

    this.assertActive();

    this.queryBus.unregister(type, handler);
  }

  /**
   * Dispatches a command and returns the handler result as-is.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns The command result.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no command handler is registered.
   *
   * @example
   * ```typescript
   * scope.executeCommand("LOGOUT");
   * ```
   */
  public executeCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(type: T, data?: D): R {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    this.assertActive();

    return this.commandBus.execute<R, D>(type, data);
  }

  /**
   * Dispatches a command and returns the result as a Promise.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns A Promise resolving to the command result.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no command handler is registered.
   *
   * @example
   * ```typescript
   * await scope.executeCommandAsync("LOGOUT");
   * ```
   */
  public executeCommandAsync<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): Promise<R> {
    dbg.info(prefix(__filename), "Execute async command:", { type, data });

    this.assertActive();

    return this.commandBus.executeAsync<R, D>(type, data);
  }

  /**
   * Dispatches a command if a handler is registered, otherwise returns null.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns The command result or `null`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.executeOptionalCommand("CLEANUP_CACHE");
   * ```
   */
  public executeOptionalCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): Optional<R> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    this.assertActive();

    return this.commandBus.executeOptional<R, D>(type, data);
  }

  /**
   * Dispatches an optional command and returns the result as a Promise.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns A Promise resolving to the command result or `null`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const result: string | null = await scope.executeOptionalCommandAsync("CLEANUP_CACHE");
   * ```
   */
  public executeOptionalCommandAsync<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): Promise<Optional<R>> {
    dbg.info(prefix(__filename), "Execute optional async command:", { type, data });

    this.assertActive();

    return this.commandBus.executeOptionalAsync<R, D>(type, data);
  }

  /**
   * Registers a handler for a specific command type.
   *
   * @template D - Type of the command payload.
   * @template R - Type of the command result.
   *
   * @param type - Command identifier.
   * @param handler - The handler function.
   * @returns A function to unregister the handler.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.registerCommandHandler("LOG_ERROR", (error) => {
   *   console.error(error);
   * });
   * ```
   */
  public registerCommandHandler<D = unknown, R = unknown>(
    type: CommandType,
    handler: CommandHandler<D, R>
  ): CommandUnregister {
    dbg.info(prefix(__filename), "Register command handler:", { type });

    this.assertActive();

    return this.commandBus.register(type, handler);
  }

  /**
   * Removes a specific command handler registration.
   *
   * @template D - Type of the command payload.
   * @template R - Type of the command result.
   *
   * @param type - Command identifier.
   * @param handler - The handler instance to remove.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.unregisterCommandHandler("LOG_ERROR", this.handleLogError);
   * ```
   */
  public unregisterCommandHandler<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregister command:", { type });

    this.assertActive();

    this.commandBus.unregister(type, handler);
  }

  /**
   * Reads the shared seed object.
   *
   * @remarks
   * Call without a key to get the one shared seed for this container.
   *
   * @template T - Expected type of the shared seed object.
   * @returns The shared seed object.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
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
   * Targeted seeds are keyed by service class, string, or symbol.
   *
   * @template T - Expected type of the seed value.
   * @param seed - Lookup token for the seed.
   * @returns The seed value or `null` if not found.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const apiUrl: string = scope.getSeed("API_URL");
   * ```
   */
  public getSeed<T>(seed: SeedKey): Optional<T>;

  public getSeed<T>(seed?: SeedKey): Optional<T> {
    dbg.info(prefix(__filename), "Get seed for key:", {
      key: (seed as AnyObject)?.name ?? seed,
    });

    if (seed === undefined) {
      this.assertActive();

      return this.container.get<T>(SEED_TOKEN);
    } else {
      this.assertActive();

      const seeds: SeedsMap = this.container.get<SeedsMap>(SEEDS_TOKEN);

      return seeds.has(seed) ? (seeds.get(seed) as T) : null;
    }
  }

  /**
   * Verifies that this scope still belongs to an active service instance.
   *
   * @throws {@link WirestateError} If the scope is accessed before activation
   * or after disposal.
   */
  private assertActive(): void {
    if (this.container) {
      return;
    }

    if (this.isDisposed) {
      throw new WirestateError(
        ERROR_CODE_ACCESS_AFTER_DISPOSAL,
        "WireScope::container accessed after deactivation. Ensure service is properly disposed."
      );
    } else {
      throw new WirestateError(
        ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
        "WireScope::container accessed before activation. " +
          "Ensure service is bound to container and is properly resolved."
      );
    }
  }
}
