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
 * Injectable scope providing access to wirestate buses and seeds.
 * Each injecting service receives its own instance (transient scope).
 * The scope is activated and deactivated automatically alongside its owner service.
 */
@injectable()
export class WireScope {
  /**
   * Whether the scope was deactivated and disposed from the container.
   */
  public readonly isDisposed: boolean = false;

  public constructor(private readonly container: Optional<Container>) {}

  /**
   * Access the IoC container.
   * Available only for activated instances of scope.
   *
   * @returns active container
   *
   * @throws WirestateError if scope is not activated or already disposed
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
   * Resolves a sibling service or injected value.
   * Use for lazy resolution or circular dependency breaking.
   * Available only for activated containers.
   *
   * @param injectionId - injection identifier
   * @returns resolved injection, service instance, or generic value
   *
   * @throws WirestateError if scope is not activated
   */
  public resolve<T>(injectionId: ServiceIdentifier<T>): T {
    dbg.info(prefix(__filename), "Lazy resolve:", {
      name: (injectionId as AnyObject)?.name ?? injectionId,
      key: injectionId,
    });

    return this.getContainer().get<T>(injectionId);
  }

  /**
   * Resolves a sibling service or injected value.
   * Use for lazy resolution or circular dependency breaking.
   * Available only for activated containers.
   *
   * @param injectionId - injection identifier
   * @returns resolved injection, service instance, generic value, or null if it is not bound
   *
   * @throws WirestateError if scope is not activated
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
   * Broadcasts an event.
   * Available only for activated containers.
   *
   * @param type - type of event to emit
   * @param payload - optional payload to send with the event
   * @param from - optional sender of the event
   *
   * @throws WirestateError if scope is not activated
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
   * Subscribes a handler to all events on the event bus.
   * Available only for activated containers.
   *
   * @param handler - event handler function
   * @returns unsubscribe function
   *
   * @throws WirestateError if scope is not activated
   */
  public subscribeToEvent(handler: EventHandler): EventUnsubscriber {
    dbg.info(prefix(__filename), "Subscribe event:", { handler });

    return this.getContainer().get(EventBus).subscribe(handler);
  }

  /**
   * Removes a specific event subscription by handler reference.
   * Available only for activated containers.
   *
   * @param handler - event handler to remove
   *
   * @throws WirestateError if scope is not activated
   */
  public unsubscribeFromEvent(handler: EventHandler): void {
    dbg.info(prefix(__filename), "Unsubscribe event:", { handler });

    this.getContainer().get(EventBus).unsubscribe(handler);
  }

  /**
   * Dispatches a query and returns the result.
   * Available only for activated containers.
   *
   * @param type - query type
   * @param data - query data
   * @returns query result
   *
   * @throws WirestateError if scope is not activated
   */
  public queryData<R = unknown, D = unknown, T extends QueryType = QueryType>(type: T, data?: D): MaybePromise<R> {
    dbg.info(prefix(__filename), "Query data:", { type, data });

    return this.getContainer().get(QueryBus).query<R, D>(type, data);
  }

  /**
   * Dispatches a query and returns the result.
   * Available only for activated containers.
   *
   * @param type - query type
   * @param data - query data
   * @returns query result or null if handler is not registered
   */
  public queryOptionalData<R = unknown, D = unknown, T extends QueryType = QueryType>(
    type: T,
    data?: D
  ): Optional<MaybePromise<R>> {
    dbg.info(prefix(__filename), "Query optional data:", { type, data });

    return this.getContainer().get(QueryBus).queryOptional<R, D>(type, data);
  }

  /**
   * Registers a query handler on the query bus.
   * Available only for activated containers.
   *
   * @param type - query type
   * @param handler - handler function
   * @returns unregister function
   *
   * @throws WirestateError if scope is not activated
   */
  public registerQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): QueryUnregister {
    dbg.info(prefix(__filename), "Register query handler:", { type });

    return this.getContainer().get(QueryBus).register(type, handler);
  }

  /**
   * Unregisters a specific query handler by type and reference.
   * Available only for activated containers.
   *
   * @param type - query type
   * @param handler - handler to remove
   *
   * @throws WirestateError if scope is not activated
   */
  public unregisterQueryHandler<D = unknown, R = unknown>(type: QueryType, handler: QueryHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregister query:", { type });

    this.getContainer().get(QueryBus).unregister(type, handler);
  }

  /**
   * Dispatches a command and returns the descriptor.
   * Available only for activated containers.
   *
   * @param type - command type
   * @param data - command data
   * @returns command descriptor
   *
   * @throws WirestateError if scope is not activated
   */
  public executeCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): CommandDescriptor<R> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    return this.getContainer().get(CommandBus).command<R, D>(type, data);
  }

  /**
   * Dispatches a command and returns the descriptor.
   * Available only for activated containers.
   *
   * @param type - command type
   * @param data - command data
   * @returns command descriptor or null if handler is not registered
   */
  public executeOptionalCommand<R = unknown, D = unknown, T extends CommandType = CommandType>(
    type: T,
    data?: D
  ): Optional<CommandDescriptor<R>> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    return this.getContainer().get(CommandBus).commandOptional<R, D>(type, data);
  }

  /**
   * Registers a command handler on the command bus.
   * Available only for activated containers.
   *
   * @param type - command type
   * @param handler - handler function
   * @returns unregister function
   *
   * @throws WirestateError if scope is not activated
   */
  public registerCommandHandler<D = unknown, R = unknown>(
    type: CommandType,
    handler: CommandHandler<D, R>
  ): CommandUnregister {
    dbg.info(prefix(__filename), "Register command handler:", { type });

    return this.getContainer().get(CommandBus).register(type, handler);
  }

  /**
   * Unregisters a specific command handler by type and reference.
   * Available only for activated containers.
   *
   * @param type - command type
   * @param handler - handler to remove
   *
   * @throws WirestateError if scope is not activated
   */
  public unregisterCommandHandler<D = unknown, R = unknown>(type: CommandType, handler: CommandHandler<D, R>): void {
    dbg.info(prefix(__filename), "Unregister command:", { type });

    this.getContainer().get(CommandBus).unregister(type, handler);
  }

  public getSeed<T>(): T;
  public getSeed<T>(seed?: SeedKey): Optional<T>;

  /**
   * Reads seed for the provided injection.
   * Returns shared seed if parameters are not provided.
   * Available only for activated containers.
   *
   * @param seed - lookup key
   * @returns seed data or null if missing
   *
   * @throws WirestateError if context is not activated
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
