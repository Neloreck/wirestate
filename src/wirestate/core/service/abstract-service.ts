import { type Container, type ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ERROR_CODE_ACCESS_BEFORE_ACTIVATION } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { InitialState } from "@/wirestate/core/initial-state/initial-state";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  CONTAINER_REFS_BY_SERVICE,
  INITIAL_STATE_TOKEN,
  QUERY_BUS_TOKEN,
  SIGNAL_BUS_TOKEN,
} from "@/wirestate/core/registry";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { Optional, TAnyObject, MaybePromise, Maybe } from "@/wirestate/types/general";
import type { TInitialStateKey } from "@/wirestate/types/initial-state";
import type { TQueryType } from "@/wirestate/types/queries";
import type { ISignal, TSignalType } from "@/wirestate/types/signals";

/**
 * Base class for services.
 */
export abstract class AbstractService {
  /**
   * Disposal flag.
   * Check in async actions to avoid updating unmounted services.
   */
  public readonly IS_DISPOSED: boolean = false;

  /**
   * Access the IoC container.
   * Internal. Use for on-demand resolution.
   *
   * @returns active container
   */
  protected getContainer(): Container {
    const ref: Maybe<Container> = CONTAINER_REFS_BY_SERVICE.get(this);

    if (ref) {
      return ref;
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

  /**
   * Resolves a sibling service.
   * Use for lazy resolution or circular dependency breaking.
   *
   * @param serviceId - service identifier
   * @returns resolved service instance
   */
  protected getService<T>(serviceId: ServiceIdentifier<T>): T {
    dbg.info(prefix(__filename), "Lazy getService:", {
      name: (serviceId as TAnyObject)?.name ?? serviceId,
      key: serviceId,
    });

    return this.getContainer().get<T>(serviceId);
  }

  /**
   * Broadcasts a signal.
   *
   * @param signal - signal to emit
   */
  protected emitSignal<P, T extends TSignalType = TSignalType>(signal: ISignal<P, T>): void {
    dbg.info(prefix(__filename), "Emit signal:", {
      name: this.constructor.name,
      type: signal?.type,
      signal,
      from: this,
    });

    this.getContainer().get<SignalBus>(SIGNAL_BUS_TOKEN).emit(signal);
  }

  /**
   * Dispatches a query and returns the result.
   *
   * @param type - query type
   * @param data - query data
   * @returns query result
   */
  protected queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): MaybePromise<R> {
    dbg.info(prefix(__filename), "Query data:", { name: this.constructor.name, type, data, from: this.constructor });

    return this.getContainer().get<QueryBus>(QUERY_BUS_TOKEN).query<R, D>(type, data);
  }

  protected getInitialState<T>(): T;
  protected getInitialState<T>(ServiceClass?: TInitialStateKey): Optional<T>;

  /**
   * Reads initial state (seed) for the service.
   * Available from `onActivated` onwards.
   *
   * @param ServiceClass - lookup key (defaults to current class)
   * @returns seed data or null if missing
   */
  protected getInitialState<T extends TAnyObject>(ServiceClass?: TInitialStateKey): Optional<T> {
    dbg.info(prefix(__filename), "Get initial state for key:", {
      key: (ServiceClass as TAnyObject)?.name ?? ServiceClass,
    });

    const initialState: InitialState = this.getContainer().get<InitialState>(INITIAL_STATE_TOKEN);

    return (ServiceClass ? initialState.getFor<T>(ServiceClass) : initialState.getShared()) || null;
  }

  /**
   * Lifecycle hook: runs after activation.
   * Override for initialization.
   */
  public onActivated(): MaybePromise<void> {}

  /**
   * Lifecycle hook: runs before deactivation.
   * Override for cleanup.
   */
  public onDeactivated(): MaybePromise<void> {}

  /**
   * Catch-all signal handler.
   * Subscribed automatically during the service lifecycle.
   */
  public onSignal?(signal: ISignal): void;
}
