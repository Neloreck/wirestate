import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Injectable, Container, ServiceIdentifier } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { ERROR_CODE_ACCESS_AFTER_DISPOSAL, ERROR_CODE_ACCESS_BEFORE_ACTIVATION } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";
import { CommandDescriptor, CommandHandler, CommandUnregister, CommandType } from "../types/commands";
import { EventHandler, EventType, EventUnsubscriber } from "../types/events";
import { Optional, AnyObject } from "../types/general";
import { SeedKey, SeedsMap } from "../types/initial-state";
import { QueryHandler, QueryUnregister, QueryType } from "../types/queries";

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

  public constructor(private readonly container: Optional<Container>) {}

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
   * Provides direct access to the underlying Inversify {@link Container}.
   *
   * @returns The active {@link Container}.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const container: Container = scope.getContainer();
   *
   * container.bind("TOKEN").toConstantValue(42);
   * ```
   */
  public getContainer(): Container {
    if (this.container) {
      return this.container;
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
   * @param injectionId - Service token (class constructor, symbol, or string).
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
  public resolve<T>(injectionId: ServiceIdentifier<T>): T {
    dbg.info(prefix(__filename), "Lazy resolve:", {
      name: (injectionId as AnyObject)?.name ?? injectionId,
      key: injectionId,
    });

    return this.getContainer().get<T>(injectionId);
  }

  /**
   * Lazily resolves a service if it is bound, otherwise returns null.
   *
   * @template T - Type of the service or value to resolve.
   *
   * @param injectionId - Service token (class constructor, symbol, or string).
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
  public resolveOptional<T>(injectionId: ServiceIdentifier<T>): Optional<T> {
    dbg.info(prefix(__filename), "Lazy optional resolve:", {
      name: (injectionId as AnyObject)?.name ?? injectionId,
      key: injectionId,
    });

    const container: Container = this.getContainer();

    return container.isBound(injectionId) ? container.get<T>(injectionId) : null;
  }

  /**
   * Dispatches an event to the {@link EventBus}.
   *
   * @template P - Type of the event payload.
   * @template T - Type of the event identifier.
   *
   * @param type - Event identifier.
   * @param payload - Optional data associated with the event.
   * @param from - Optional source identifier (defaults to current scope).
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * scope.emitEvent("VALUE_CHANGED", { value: "abcd" });
   * ```
   */
  public emitEvent<P, T extends EventType = EventType>(type: T, payload?: P, from?: unknown): void {
    dbg.info(prefix(__filename), "Emit event:", {
      type,
      payload,
      from: from === undefined ? this : from,
    });

    this.getContainer()
      .get(EventBus)
      .emit(type, payload, from === undefined ? this : from);
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

    return this.getContainer().get(EventBus).subscribe(handler);
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

    this.getContainer().get(EventBus).unsubscribe(handler);
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
   * const user: User = scope.queryData("GET_USER", { id: 1 });
   * ```
   */
  public queryData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): R {
    dbg.info(prefix(__filename), "Query data:", { type, data });

    return this.getContainer().get(QueryBus).query<R, D>(type, data);
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
   * const user: User = await scope.queryDataAsync("GET_USER", { id: 1 });
   * ```
   */
  public queryDataAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Promise<R> {
    dbg.info(prefix(__filename), "Async query data:", { type, data });

    return this.getContainer().get(QueryBus).queryAsync<R, D>(type, data);
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
   * const config: Config | null = scope.queryOptionalData("GET_CONFIG");
   * ```
   */
  public queryOptionalData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): Optional<R> {
    dbg.info(prefix(__filename), "Query optional data:", { type, data });

    return this.getContainer().get(QueryBus).queryOptional<R, D>(type, data);
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
   * const config: Config | null = await scope.queryOptionalDataAsync("GET_CONFIG");
   * ```
   */
  public queryOptionalDataAsync<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Promise<Optional<R>> {
    dbg.info(prefix(__filename), "Optional async query data:", { type, data });

    return this.getContainer().get(QueryBus).queryOptionalAsync<R, D>(type, data);
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

    return this.getContainer().get(QueryBus).register(type, handler);
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

    this.getContainer().get(QueryBus).unregister(type, handler);
  }

  /**
   * Dispatches a command and returns progress.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns A descriptor with `status` and `task`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no command handler is registered.
   *
   * @example
   * ```typescript
   * const descriptor: CommandDescriptor = scope.executeCommand("LOGOUT");
   *
   * await descriptor.task;
   * ```
   */
  public executeCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): CommandDescriptor<R> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    return this.getContainer().get(CommandBus).command<R, D>(type, data);
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
   * @returns A {@link CommandDescriptor} or `null`.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * const descriptor: CommandDescriptor | null = scope.executeOptionalCommand("CLEANUP_CACHE");
   *
   * if (descriptor) {
   *   await descriptor.task;
   * }
   * ```
   */
  public executeOptionalCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): Optional<CommandDescriptor<R>> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    return this.getContainer().get(CommandBus).commandOptional<R, D>(type, data);
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

    return this.getContainer().get(CommandBus).register(type, handler);
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

    this.getContainer().get(CommandBus).unregister(type, handler);
  }

  /**
   * Reads the shared seed object.
   *
   * @remarks
   * Call without a key to get the one shared seed for this container.
   *
   * @template T - Expected type of the global seed object.
   * @returns The global seed object.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * interface GlobalSeed {
   *   apiUrl: string;
   * }
   *
   * const seeds: GlobalSeed = scope.getSeed();
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
   * @param seed - Lookup key (identifier or token) for the seed.
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
    dbg.info(prefix(__filename), "Get initial state for key:", {
      key: (seed as AnyObject)?.name ?? seed,
    });

    if (seed === undefined) {
      return this.getContainer().get<T>(SEED_TOKEN);
    } else {
      const seeds: SeedsMap = this.getContainer().get<SeedsMap>(SEEDS_TOKEN);

      return seeds.has(seed) ? (seeds.get(seed) as T) : null;
    }
  }
}
