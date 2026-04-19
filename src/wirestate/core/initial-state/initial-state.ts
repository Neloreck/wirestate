import type { Optional, TAnyObject } from "@/wirestate/types/general";
import type { TInitialStateEntries, TInitialStateKey } from "@/wirestate/types/initial-state";

/**
 * Container-scoped storage for service seeds.
 */
export class InitialState {
  /**
   * Internal states storage.
   */
  private readonly boundStates: Map<TInitialStateKey, unknown>;
  private readonly sharedState: TAnyObject;

  public constructor(shared: TAnyObject = {}, bound: TInitialStateEntries = []) {
    this.sharedState = shared;
    this.boundStates = new Map();

    for (const [ServiceClass, state] of bound) {
      this.boundStates.set(ServiceClass, state);
    }
  }

  /**
   * Returns the shared state.
   *
   * @returns shared initial state for all services
   */
  public getShared<T extends TAnyObject>(): T {
    return this.sharedState as T;
  }

  /**
   * Returns the seed for the given service.
   *
   * @param ServiceClass - service constructor
   * @returns initial state data or null if missing
   */
  public getFor<T extends TAnyObject>(ServiceClass: TInitialStateKey): Optional<T> {
    return (this.boundStates.get(ServiceClass) || null) as Optional<T>;
  }

  /**
   * Checks if a seed exists for the given service.
   *
   * @param ServiceClass - service constructor
   * @returns true if seed exists
   */
  public hasFor(ServiceClass: TInitialStateKey): boolean {
    return this.boundStates.has(ServiceClass);
  }
}
