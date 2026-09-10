import { type ContainerKernel } from "../container/container-kernel";
import { ERROR_CODE_NOT_TRACKED } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { type Nullable, type Optional } from "../types/general";

/**
 * Internal storage for service lifecycle status keyed by instance.
 *
 * Status survives deactivation while the instance object is still reachable,
 * which lets callers inspect lifecycle state by instance reference.
 */
const INSTANCE_STATUSES_BY_INSTANCE: WeakMap<object, WireStatus> = new WeakMap();

/**
 * Mutable view of a {@link WireStatus} for the lifecycle code that advances it.
 *
 * @remarks
 * The same object as the status, typed writable. The public class exposes the flags as `readonly`
 * and keeps the bookkeeping fields private, so a consumer holding a status cannot write it through
 * the types. Lifecycle code obtains this view through {@link getMutableStatus} or
 * {@link trackMutableStatus}, which is the only place a status is mutated.
 *
 * @internal
 */
export interface MutableWireStatus {
  /**
   * Container that activated the instance. It is cleared on deactivation so a
   * user-held deactivated instance does not pin its container.
   */
  container: Optional<ContainerKernel>;

  /**
   * Whether the instance was deactivated and removed from its container.
   */
  isDeactivated: boolean;

  /**
   * Provider ownership of the instance. See {@link WireStatus.isDeprovisioned}.
   */
  isDeprovisioned: Nullable<boolean>;

  /**
   * Current provision cycle of the instance. See {@link WireStatus.provisionId}.
   */
  provisionId: Nullable<ProvisionId>;

  /**
   * Last provision id issued to the instance. Monotonic across cycles, so a reprovisioned instance
   * never reuses the id its previous cycle handed out even though `provisionId` resets in between.
   */
  lastProvisionId: Optional<ProvisionId>;
}

/**
 * Numeric ID for one provider provision cycle of a service instance.
 *
 * @remarks
 * IDs are unique only within a single service instance. Pass the value handed to
 * `@OnProvision` and `@OnDeprovision` to {@link WireStatus.isStale} to ignore
 * async work from an older provision cycle.
 *
 * @group Lifecycle
 */
export type ProvisionId = number;

/**
 * Read-only lifecycle status for one resolved service instance.
 *
 * @remarks
 * Wirestate keeps one stable `WireStatus` object per resolved service instance and updates it as
 * the container and provider lifecycle progress. Application code can hold a reference and read
 * the current flags without mutating the instance or requiring a base class. The flags are
 * `readonly`: Wirestate advances them internally, and application code only reads them.
 *
 * @group Lifecycle
 */
export class WireStatus {
  /**
   * Returns the lifecycle status tracked for a resolved service instance.
   *
   * @remarks
   * Use this inside service methods when async work needs to check whether the
   * service has been deactivated or deprovisioned. The instance must already be
   * tracked, which it is from activation onward, so every lifecycle hook and any
   * method reachable from one can call it. To start tracking from a constructor,
   * where activation has not run yet, use {@link WireStatus.track} instead.
   *
   * @group Lifecycle
   *
   * @param instance - Resolved service instance to inspect.
   * @returns The stable lifecycle status for the instance.
   *
   * @throws {@link WirestateError} If the object is not tracked by Wirestate.
   */
  public static for(instance: object): WireStatus {
    const status: Optional<WireStatus> = INSTANCE_STATUSES_BY_INSTANCE.get(instance);

    if (status) {
      return status;
    }

    throw new WirestateError("Object is not tracked by Wirestate.", ERROR_CODE_NOT_TRACKED);
  }

  /**
   * Starts lifecycle tracking for an instance and returns its status.
   *
   * @remarks
   * Use this in a service constructor to hold the status as a field, which is
   * the only form that reaches async methods outside the lifecycle hooks:
   *
   * ```ts
   * public constructor(private readonly status: WireStatus = WireStatus.track(this)) {}
   * ```
   *
   * Idempotent: an already-tracked instance keeps its existing status object, so
   * a constructor call and the later activation share one stable status.
   *
   * @group Lifecycle
   *
   * @param instance - Service instance to track.
   * @returns The stable lifecycle status for the instance.
   */
  public static track(instance: object): WireStatus {
    let status: Optional<WireStatus> = INSTANCE_STATUSES_BY_INSTANCE.get(instance);

    if (!status) {
      status = new WireStatus();
      INSTANCE_STATUSES_BY_INSTANCE.set(instance, status);
    }

    return status;
  }

  /**
   * Whether the instance was deactivated and removed from its container.
   */
  public readonly isDeactivated: boolean = false;

  /**
   * Whether the instance has been removed from provider ownership.
   *
   * @remarks
   * `null` means the instance has not reached provider lifecycle yet.
   * `false` means the instance is currently owned by a provider. `true` means
   * the provider deprovisioned it.
   */
  public readonly isDeprovisioned: Nullable<boolean> = null;

  /**
   * Current provider provision cycle ID for the instance.
   *
   * @remarks
   * Every instance a container owns is stamped for the cycle, not only the ones declaring
   * `@OnProvision` or `@OnDeprovision`, so {@link WireStatus.isStale} can report a superseded
   * cycle for any service.
   *
   * `null` means the instance has not entered a tracked provider provision cycle: it is not owned
   * by a provisioned container, or it was resolved after the current cycle had already wired its
   * instances, in which case the next cycle stamps it.
   */
  public readonly provisionId: Nullable<ProvisionId> = null;

  /**
   * Container that activated the instance. See {@link MutableWireStatus.container}.
   */
  private container: Optional<ContainerKernel> = undefined;

  /**
   * Last provision id issued to the instance. See {@link MutableWireStatus.lastProvisionId}.
   */
  private lastProvisionId: Optional<ProvisionId> = undefined;

  private constructor() {}

  /**
   * Whether the instance should stop work because its lifecycle ended.
   *
   * @remarks
   * Derived from `isDeactivated` and `isDeprovisioned`.
   *
   * @returns `true` once the instance was deactivated or deprovisioned.
   */
  public get isInactive(): boolean {
    return this.isDeactivated || this.isDeprovisioned === true;
  }

  /**
   * Reports whether work started in a provision cycle should be discarded.
   *
   * @remarks
   * The guard for anything that resumes after an `await`. It is stale when the
   * instance ended its lifecycle (deactivated or deprovisioned) or when a newer
   * provision cycle has superseded the one the work belongs to:
   *
   * ```ts
   * public async onProvision(provisionId: ProvisionId): Promise<void> {
   *   const result = await loadResult();
   *
   *   if (this.status.isStale(provisionId)) {
   *     return;
   *   }
   *
   *   this.applyResult(result);
   * }
   * ```
   *
   * Both clauses matter. Deprovision restores `provisionId` to the value the hook
   * received, and deactivation leaves it untouched, so an id comparison alone stays
   * equal and lets a late result through after the lifecycle has ended.
   *
   * Outside a provision hook, snapshot `provisionId` before the `await` and pass
   * the snapshot back. A `null` snapshot means the instance had not been
   * provisioned yet, and stays current until a cycle starts.
   *
   * @group Lifecycle
   *
   * @param provisionId - Provision cycle the work belongs to, as passed to
   *   `@OnProvision` or snapshotted from {@link WireStatus.provisionId}.
   * @returns Whether the work belongs to an ended or superseded lifecycle.
   */
  public isStale(provisionId: Nullable<ProvisionId>): boolean {
    return this.isInactive || this.provisionId !== provisionId;
  }
}

/**
 * Returns the lifecycle status of an instance, or `undefined` when it is not tracked.
 *
 * @remarks
 * The non-throwing counterpart of {@link WireStatus.for}, for internal callers that
 * inspect arbitrary objects rather than their own instance.
 *
 * @internal
 *
 * @param instance - Object to look up.
 * @returns The instance's lifecycle status, or `undefined` when it is not tracked.
 */
export function tryGetWireStatus(instance: object): Optional<WireStatus> {
  return INSTANCE_STATUSES_BY_INSTANCE.get(instance);
}

/**
 * Returns the mutable view of a tracked instance's status.
 *
 * @remarks
 * The only write path into a {@link WireStatus}. The cast is sound because the status object carries
 * exactly these fields, publicly as `readonly` and privately for the bookkeeping ones.
 *
 * @internal
 *
 * @param instance - Resolved service instance to look up.
 * @returns The instance's status, writable.
 *
 * @throws {@link WirestateError} If the object is not tracked by Wirestate.
 */
export function getMutableStatus(instance: object): MutableWireStatus {
  return WireStatus.for(instance) as unknown as MutableWireStatus;
}

/**
 * Returns the mutable view of an instance's status, starting tracking on first use.
 *
 * @internal
 *
 * @param instance - Service instance to look up.
 * @returns The instance's status, writable.
 */
export function trackMutableStatus(instance: object): MutableWireStatus {
  return WireStatus.track(instance) as unknown as MutableWireStatus;
}

/**
 * Returns the container that activated a service instance.
 *
 * @internal
 *
 * @param instance - Resolved service instance to look up.
 * @returns The owning container, or `undefined` when the instance is not active.
 */
export function getInstanceContainer(instance: object): Optional<ContainerKernel> {
  const status: Optional<WireStatus> = INSTANCE_STATUSES_BY_INSTANCE.get(instance);

  return status && (status as unknown as MutableWireStatus).container;
}
