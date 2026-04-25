import { injectable, Container, ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import {
  ERROR_CODE_ACCESS_AFTER_DISPOSAL,
  ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
} from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  COMMAND_BUS_TOKEN,
  SEED_TOKEN,
  SEEDS_TOKEN,
  QUERY_BUS_TOKEN,
  SIGNAL_BUS_TOKEN,
} from "@/wirestate/core/registry";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { ICommandDescriptor, TCommandType } from "@/wirestate/types/commands";
import type { Optional, TAnyObject, MaybePromise } from "@/wirestate/types/general";
import type { TSeedKey, TSeedsMap } from "@/wirestate/types/initial-state";
import type { TQueryType } from "@/wirestate/types/queries";
import type { TSignalType } from "@/wirestate/types/signals";

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
        "WireScope::container accessed after deactivation. " +
          "Ensure service is properly disposed and MobX refs are observing latest services."
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
      name: (injectionId as TAnyObject)?.name ?? injectionId,
      key: injectionId,
    });

    return this.getContainer().get<T>(injectionId);
  }

  /**
   * Broadcasts a signal.
   * Available only for activated containers.
   *
   * @param type - type of signal to emit
   * @param payload - optional payload to send with the signal
   * @param from - optional sender of the signal
   *
   * @throws WirestateError if scope is not activated
   */
  public emitSignal<P, T extends TSignalType = TSignalType>(type: T, payload?: P, from?: unknown): void {
    dbg.info(prefix(__filename), "Emit signal:", {
      type,
      payload,
      from: from === undefined ? this : from,
    });

    this.getContainer()
      .get<SignalBus>(SIGNAL_BUS_TOKEN)
      .emit({
        type,
        payload,
        from: from === undefined ? this : from,
      });
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
  public queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): MaybePromise<R> {
    dbg.info(prefix(__filename), "Query data:", { type, data });

    return this.getContainer().get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data);
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
  public executeCommand<R = unknown, D = unknown, T extends TCommandType = TCommandType>(
    type: T,
    data?: D
  ): ICommandDescriptor<R> {
    dbg.info(prefix(__filename), "Execute command:", { type, data });

    return this.getContainer().get<CommandBus>(COMMAND_BUS_TOKEN).command<R, D>(type, data);
  }

  public getSeed<T>(): T;
  public getSeed<T>(seed?: TSeedKey): T;

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
  public getSeed<T extends TAnyObject>(seed?: TSeedKey): Optional<T> {
    dbg.info(prefix(__filename), "Get initial state for key:", {
      key: (seed as TAnyObject)?.name ?? seed,
    });

    return seed
      ? (this.getContainer().get<TSeedsMap>(SEEDS_TOKEN).get(seed) as T) || null
      : this.getContainer().get<T>(SEED_TOKEN);
  }
}
