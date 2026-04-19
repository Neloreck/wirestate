import { type Container, injectable, type ServiceIdentifier } from "inversify";

import { InitialState } from "../initial-state/InitialState";
import { QueryBus } from "../queries/QueryBus";
import { CONTAINER_REFS_BY_SERVICE, INITIAL_STATE_TOKEN, QUERY_BUS_TOKEN, SIGNAL_BUS_TOKEN } from "../registry";
import type { SignalBus } from "../signals/SignalBus";
import type { TAnyObject } from "../types/general";
import type { TInitialStateKey } from "../types/initial-state";
import type { TQueryType } from "../types/queries";
import type { ISignal, TSignalType } from "../types/signals";

/**
 * Base class for services.
 */
@injectable()
export abstract class AbstractService {
  /**
   * Disposal flag.
   * Check in async actions to avoid updating unmounted services.
   */
  public readonly IS_DISPOSED: boolean = false;

  /**
   * Access the IoC container.
   * Internal. Use for on-demand resolution.
   */
  protected getContainer(): Container {
    const ref = CONTAINER_REFS_BY_SERVICE.get(this);

    if (!ref) {
      throw new Error(
        "[ioc] BaseService.container accessed before activation. " +
          "Ensure service is bound via bindService() and resolved by the container."
      );
    }

    return ref;
  }

  /**
   * Resolves a sibling service.
   * Use for lazy resolution or circular dependency breaking.
   *
   * @param serviceId - service identifier
   * @returns resolved service instance
   */
  protected getService<T>(serviceId: ServiceIdentifier<T>): T {
    return this.getContainer().get<T>(serviceId);
  }

  /**
   * Broadcasts a signal.
   *
   * @param signal - signal to emit
   */
  protected emitSignal<P, T extends TSignalType = TSignalType>(signal: ISignal<P, T>): void {
    this.getContainer().get<SignalBus>(SIGNAL_BUS_TOKEN)
      .emit(signal);
  }

  /**
   * Dispatches a query and returns the result.
   *
   * @param type - query type
   * @param data - query data
   * @returns query result
   */
  protected queryData<R = unknown, D = unknown, T extends TQueryType = TQueryType>(type: T, data?: D): R | Promise<R> {
    return this.getContainer().get<QueryBus>(QUERY_BUS_TOKEN)
      .query<R, D>(type, data);
  }

  protected getInitialState<T>(): T;
  protected getInitialState<T>(ServiceClass?: TInitialStateKey): T | null;

  /**
   * Reads initial state (seed) for the service.
   * Available from `onActivated` onwards.
   *
   * @param ServiceClass - lookup key (defaults to current class)
   * @returns seed data or null if missing
   */
  protected getInitialState<T extends TAnyObject>(ServiceClass?: TInitialStateKey): T | null {
    const initialState: InitialState = this.getContainer().get<InitialState>(INITIAL_STATE_TOKEN);

    return (ServiceClass ? initialState.getFor<T>(ServiceClass) : initialState.getShared()) || null;
  }

  /**
   * Lifecycle hook: runs after activation.
   * Override for initialization.
   */
  public onActivated(): void {}

  /**
   * Lifecycle hook: runs before deactivation.
   * Override for cleanup.
   */
  public onDeactivated(): void {}

  /**
   * Catch-all signal handler.
   * Subscribed automatically during service lifecycle.
   */
  public onSignal?(signal: ISignal): void;
}
