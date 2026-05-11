import { injectable, Container, ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "../commands/command-bus";
import { ERROR_CODE_ACCESS_AFTER_DISPOSAL, ERROR_CODE_ACCESS_BEFORE_ACTIVATION } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../registry";
import type { CommandDescriptor, CommandHandler, CommandUnregister, CommandType } from "../types/commands";
import type { EventHandler, EventType, EventUnsubscriber } from "../types/events";
import type { Optional, AnyObject, MaybePromise } from "../types/general";
import type { SeedKey, SeedsMap } from "../types/initial-state";
import type { QueryHandler, QueryUnregister, QueryType } from "../types/queries";

/**
 * A transient bridge providing services with access to Wirestate buses, lazy resolution, and seeds.
 *
 * @remarks
 * Every service bound via {@link bindService} receives its own unique `WireScope` instance.
 * It acts as a facade to the IoC container while enforcing lifecycle safety.
 *
 * Methods are available only while the scope is "active" (after service activation and before deactivation).
 *
 * @group container
 */
@injectable()
export class WireScope {
  /**
   * Whether the scope was deactivated and disposed from the container.
   */
  public readonly isDisposed: boolean = false;

  public constructor(private readonly container: Optional<Container>) {}

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
   * Lazily resolves a service or value from the container.
   *
   * @remarks
   * Use this to break circular dependencies or for services that are not needed immediately.
   *
   * @template T - Type of the service or value to resolve.
   *
   * @param injectionId - Service token (class constructor, symbol, or string).
   * @returns The resolved instance or value.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws Error If the service cannot be resolved from the container.
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
      .emit({
        type,
        payload,
        from: from === undefined ? this : from,
      });
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
   * Dispatches a query and waits for the result.
   *
   * @template R - Type of the query result.
   * @template D - Type of the query data (payload).
   * @template T - Type of the query identifier.
   *
   * @param type - Query identifier.
   * @param data - Input data for the query handler.
   * @returns The query result (can be a Promise).
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   * @throws {@link WirestateError} If no query handler is registered.
   *
   * @example
   * ```typescript
   * const user: User = await scope.queryData("GET_USER", { id: 1 });
   * ```
   */
  public queryData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): MaybePromise<R> {
    dbg.info(prefix(__filename), "Query data:", { type, data });

    return this.getContainer().get(QueryBus).query<R, D>(type, data);
  }

  /**
   * Dispatches a query and returns the result, or null if no handler is registered.
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
   * const config: Config | null = await scope.queryOptionalData("GET_CONFIG");
   * ```
   */
  public queryOptionalData<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Optional<MaybePromise<R>> {
    dbg.info(prefix(__filename), "Query optional data:", { type, data });

    return this.getContainer().get(QueryBus).queryOptional<R, D>(type, data);
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
   * Dispatches a command and returns a descriptor to track its progress.
   *
   * @template R - Type of the command result.
   * @template D - Type of the command payload.
   * @template T - Type of the command identifier.
   *
   * @param type - Command identifier.
   * @param data - Payload for the command.
   * @returns A {@link CommandDescriptor}.
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

  public getSeed<T>(): T;
  public getSeed<T>(seed?: SeedKey): Optional<T>;

  /**
   * Retrieves seed data (initial state) from the container.
   *
   * @remarks
   * If `seed` key is provided, looks up a specific value in the seed map.
   * If omitted, returns the global/shared seed object.
   *
   * @template T - Expected type of the seed data.
   *
   * @param seed - Optional lookup key (identifier or token).
   * @returns The seed data or `null` if not found.
   *
   * @throws {@link WirestateError} If accessed before activation or after disposal.
   *
   * @example
   * ```typescript
   * // Get specific seed
   * const apiUrl = scope.getSeed<string>("API_URL");
   *
   * // Get global seed object
   * const seeds = scope.getSeed<GlobalSeed>();
   * ```
   */
  public getSeed<T extends AnyObject>(seed?: SeedKey): Optional<T> {
    dbg.info(prefix(__filename), "Get initial state for key:", {
      key: (seed as AnyObject)?.name ?? seed,
    });

    return seed
      ? (this.getContainer().get<SeedsMap>(SEEDS_TOKEN).get(seed) as T) || null
      : this.getContainer().get<T>(SEED_TOKEN);
  }
}
