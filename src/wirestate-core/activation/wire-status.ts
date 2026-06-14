import { WirestateError } from "../error/wirestate-error";
import { Nullable } from "../types/general";

/**
 * Internal storage for service lifecycle status keyed by instance.
 *
 * Status survives deactivation while the instance object is still reachable,
 * which lets callers inspect lifecycle state by instance reference.
 */
const INSTANCE_STATUSES_BY_INSTANCE: WeakMap<object, WireStatus> = new WeakMap();

/**
 * Numeric ID for one provider provision cycle of a service instance.
 *
 * @remarks
 * IDs are unique only within a single service instance. Use the value passed to
 * `@OnProvision` and `@OnDeprovision` with
 * `WireStatus.for(instance).provisionId` to ignore async work from an older
 * provision cycle.
 *
 * @group Container
 */
export type ProvisionId = number;

/**
 * Options reserved for Wirestate lifecycle internals.
 *
 * @group Container
 */
export interface WireStatusLookupOptions {
  /**
   * Creates a tracked status when one does not exist.
   */
  readonly initialize?: boolean;
}

/**
 * Lifecycle status for one resolved service instance.
 *
 * @remarks
 * Wirestate stores one stable `WireStatus` object per resolved service
 * instance. Container and provider lifecycle internals update that object over
 * time, so application code can keep a reference and read current lifecycle
 * flags without mutating the instance or requiring a base class.
 *
 * @group Container
 */
export class WireStatus {
  /**
   * Returns the lifecycle status tracked for a resolved service instance.
   *
   * @remarks
   * Use this inside service methods when async work needs to check whether the
   * service has been disposed or deprovisioned.
   *
   * @group Container
   *
   * @param instance - Resolved service instance to inspect.
   * @param options - Reserved for Wirestate internals.
   * @returns The stable lifecycle status for the instance.
   *
   * @throws {@link WirestateError} If the object is not tracked by Wirestate.
   */
  public static for(instance: object, options?: WireStatusLookupOptions): WireStatus {
    let status = INSTANCE_STATUSES_BY_INSTANCE.get(instance);

    if (status) {
      return status;
    }

    if (options?.initialize) {
      status = new WireStatus();
      INSTANCE_STATUSES_BY_INSTANCE.set(instance, status);

      return status;
    }

    throw new WirestateError("Object is not tracked by Wirestate.");
  }

  /**
   * Whether the instance was deactivated and removed from its container.
   */
  public isDeactivated: boolean = false;

  /**
   * Whether the instance has been removed from provider ownership.
   *
   * @remarks
   * `null` means the instance has not reached provider lifecycle yet.
   * `false` means the instance is currently owned by a provider. `true` means
   * the provider deprovisioned it.
   */
  public isDeprovisioned: Nullable<boolean> = null;

  /**
   * Whether the instance should stop work because its lifecycle ended.
   *
   * @remarks
   * This is derived from `isDeactivated` and `isDeprovisioned`.
   */
  public isInactive!: boolean;

  /**
   * Current provider provision cycle ID for the instance.
   *
   * @remarks
   * `null` means the instance has not entered a tracked provider provision
   * cycle.
   */
  public provisionId: Nullable<ProvisionId> = null;

  /**
   * Creates an empty status object for internal lifecycle tracking.
   *
   * @internal
   */
  public constructor() {
    Object.defineProperty(this, "isInactive", {
      enumerable: true,
      get() {
        return this.isDeactivated || this.isDeprovisioned === true;
      },
    });
  }
}
