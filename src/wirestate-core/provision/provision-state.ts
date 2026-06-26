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
   * while provider-owned, and `false` after deprovisioning.
   */
  status: Optional<boolean>;

  /**
   * Resolved provider lifecycle participant instances, in provision order.
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
    state = { status: undefined, instances: null, cycleByInstance: new Map() };
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
 * @returns `true` while provider-owned, `false` after deprovisioning, or
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
