import { type Container, type ServiceIdentifier } from "inversify";

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
  CONTAINER_REFS_BY_SERVICE,
  SEED_TOKEN,
  SEEDS_TOKEN,
  QUERY_BUS_TOKEN,
  SIGNAL_BUS_TOKEN,
} from "@/wirestate/core/registry";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { ICommandDescriptor, TCommandType } from "@/wirestate/types/commands";
import type { Optional, TAnyObject, MaybePromise, Maybe } from "@/wirestate/types/general";
import type { TSeedKey, TSeedsMap } from "@/wirestate/types/initial-state";
import type { TQueryType } from "@/wirestate/types/queries";
import type { TSignalType } from "@/wirestate/types/signals";

/**
 * Base class for services.
 */
export abstract class AbstractService {
  /**
   * Disposal flag.
   * Check in async actions to avoid updating unmounted services.
   *
   * Before activation internally set to null, but should not be surfaced as non-boolean.
   */
  public readonly IS_DISPOSED: boolean = null as unknown as boolean;

  /**
   * Access the IoC container.
   * Internal. Use for on-demand resolution.
   * Available only for activated containers.
   *
   * @returns active container
   *
   * @throws WirestateError if service is not activated
   */
  protected getContainer(): Container {
    const ref: Maybe<Container> = CONTAINER_REFS_BY_SERVICE.get(this);

    if (ref) {
      return ref;
    } else {
      if (this.IS_DISPOSED) {
        // This error means that the service was used after deactivation.
        // Usually it happens if async code is executed after the service was disposed,
        // or ref service ref was saved somewhere with incorrect memoization.
        throw new WirestateError(
          ERROR_CODE_ACCESS_AFTER_DISPOSAL,
          "AbstractService::container accessed after deactivation. " +
            "Ensure service is properly disposed and MobX refs are observing latest services."
        );
      } else {
        // Usually means that the service was not instantiated / bound within the provider.
        // Or it was created in the test environment without usage of proper mocking utils.
        throw new WirestateError(
          ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
          "AbstractService::container accessed before activation. " +
            "Ensure service is bound to container and is properly resolved."
        );
      }
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
   * @throws WirestateError if service is not activated
   */
  protected resolve<T>(injectionId: ServiceIdentifier<T>): T {
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
   * @throws WirestateError if service is not activated
   */
  protected emitSignal<P, T extends TSignalType = TSignalType>(type: T, payload?: P, from?: unknown): void {
    dbg.info(prefix(__filename), "Emit signal:", {
      name: this.constructor.name,
      type: type,
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
   * @throws WirestateError if service is not activated
   */
  protected queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): MaybePromise<R> {
    dbg.info(prefix(__filename), "Query data:", { name: this.constructor.name, type, data, from: this.constructor });

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
   * @throws WirestateError if service is not activated
   */
  protected executeCommand<R = unknown, D = unknown, T extends TCommandType = TCommandType>(
    type: T,
    data?: D
  ): ICommandDescriptor<R> {
    dbg.info(prefix(__filename), "Execute command:", {
      name: this.constructor.name,
      type,
      data,
      from: this.constructor,
    });

    return this.getContainer().get<CommandBus>(COMMAND_BUS_TOKEN).command<R, D>(type, data);
  }

  protected getSeed<T>(): T;
  protected getSeed<T>(ServiceClass?: TSeedKey): T;

  /**
   * Reads seed for the provided injection.
   * Returns shared seed if parameters are not provided.
   * Available only for activated containers.
   *
   * @param seed - lookup key
   * @returns seed data or null if missing
   *
   * @throws WirestateError if service is not activated
   */
  protected getSeed<T extends TAnyObject>(seed?: TSeedKey): Optional<T> {
    dbg.info(prefix(__filename), "Get initial state for key:", {
      key: (seed as TAnyObject)?.name ?? seed,
    });

    return seed
      ? (this.getContainer().get<TSeedsMap>(SEEDS_TOKEN).get(seed) as T) || null
      : this.getContainer().get<T>(SEED_TOKEN);
  }
}
