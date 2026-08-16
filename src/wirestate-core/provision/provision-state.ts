import { type ServiceToken } from "../binding/binding";
import { type ContainerKernel } from "../container/container-kernel";
import { type Nullable, type Optional } from "../types/general";

/**
 * Per-instance state of a container's current provision cycle.
 *
 * @remarks
 * `tokens` and `disposers` share an instance's lifetime within one provision
 * cycle, so they live in one entry rather than two parallel maps.
 *
 * @group Container
 * @internal
 */
export interface CycleEntry {
  /**
   * Binding tokens that caused the instance to enter provider lifecycle state.
   */
  tokens: Set<ServiceToken>;

  /**
   * Messaging-handler unsubscribe callbacks collected for the instance this cycle.
   */
  disposers: Array<() => void>;
}

/**
 * Provider lifecycle state owned by a single container.
 *
 * @remarks
 * One container is provisioned by at most one provider at a time, so this whole
 * record is the single source of truth for that container's provider ownership.
 *
 * @group Container
 * @internal
 */
export interface ProvisionState {
  /**
   * Tri-state provider ownership: `undefined` while never provisioned, `true`
   * while provider-owned, and `false` once deprovision begins.
   */
  status: Optional<boolean>;

  /**
   * Whether a provision cycle is currently running for this container.
   *
   * @remarks
   * `status` is transiently `undefined` for the duration of a cycle, which is
   * indistinguishable from "never provisioned"; this flag makes the in-flight
   * window observable (e.g. so a mid-cycle `@OnProvision` bind can be rejected).
   */
  provisioning: boolean;

  /**
   * Whether a deprovision transaction is currently unwinding this container.
   *
   * @remarks
   * Prevents teardown callbacks from starting a second lifecycle pass. Remains true until every
   * user hook, plugin hook, and disposer in the active pass has run.
   */
  deprovisioning: boolean;

  /**
   * Resolved provider lifecycle participant instances, in creation order - which is the order
   * their `@OnProvision` ran in, and the reverse of the order their `@OnDeprovision` will.
   *
   * @remarks
   * `null` means no instances entry is currently tracked: either the container
   * was never provisioned or its last lifecycle binding was unbound.
   */
  instances: Nullable<Array<object>>;

  /**
   * Per-instance provision-cycle state (tokens + disposers), keyed by instance.
   */
  cycleByInstance: Map<object, CycleEntry>;
}

/**
 * Internal storage for the provider lifecycle state of each container.
 *
 * @internal
 */
const PROVISION_STATE: WeakMap<ContainerKernel, ProvisionState> = new WeakMap();

/**
 * Returns the provider lifecycle state for a container, if any exists.
 *
 * @group Container
 * @internal
 *
 * @param container - Container to inspect.
 * @returns The container's provision state, or `undefined` when never provisioned.
 */
export function getProvisionState(container: ContainerKernel): Optional<ProvisionState> {
  return PROVISION_STATE.get(container);
}

/**
 * Returns whether a container is currently unwinding provider ownership.
 *
 * @remarks
 * Keeps activation-layer teardown from interrupting provider cleanup. The operation that started
 * deprovision continues after the active transaction finishes.
 *
 * @group Container
 * @internal
 *
 * @param container - Container whose provider lifecycle is being inspected.
 * @returns Whether a provider-deprovision transaction currently owns teardown.
 */
export function isContainerDeprovisioning(container: ContainerKernel): boolean {
  return PROVISION_STATE.get(container)?.deprovisioning ?? false;
}

/**
 * Returns the provider lifecycle state for a container, creating it on first use.
 *
 * @group Container
 * @internal
 *
 * @param container - Container entering provider lifecycle.
 * @returns The container's provision state.
 */
export function getOrCreateProvisionState(container: ContainerKernel): ProvisionState {
  let state: Optional<ProvisionState> = PROVISION_STATE.get(container);

  if (!state) {
    state = {
      status: undefined,
      provisioning: false,
      deprovisioning: false,
      instances: null,
      cycleByInstance: new Map(),
    };
    PROVISION_STATE.set(container, state);
  }

  return state;
}

/**
 * Returns the provider ownership state for a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container to inspect.
 * @returns `true` while provider-owned, `false` once deprovision begins, or
 * `undefined` when the container never entered provider ownership.
 */
export function getContainerProvisionStatus(container: ContainerKernel): Optional<boolean> {
  return PROVISION_STATE.get(container)?.status;
}

/**
 * Stores the provider ownership state for a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container entering or leaving provider ownership.
 * @param provisioned - `true` when provisioned, `false` when deprovisioned.
 */
export function setContainerProvisioned(container: ContainerKernel, provisioned: boolean): void {
  getOrCreateProvisionState(container).status = provisioned;
}
