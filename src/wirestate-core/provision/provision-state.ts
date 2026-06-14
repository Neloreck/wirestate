import type { ProvisionId } from "../activation/wire-status";
import type { ServiceToken } from "../binding/binding";
import type { ContainerKernel } from "../container/container-kernel";
import type { Definable, Maybe } from "../types/general";

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
  status: Definable<boolean>;

  /**
   * Resolved provider lifecycle participant instances, in provision order.
   *
   * @remarks
   * `null` means no instances entry is currently tracked: either the container
   * was never provisioned or its last lifecycle binding was unbound.
   */
  instances: Maybe<Array<object>>;

  /**
   * Binding tokens that caused each instance to enter provider lifecycle state.
   */
  tokensByInstance: Map<object, Set<ServiceToken>>;

  /**
   * Messaging-handler unsubscribe callbacks collected for each provisioned
   * instance during the current provision cycle.
   */
  disposers: Map<object, Array<() => void>>;
}

/**
 * Internal storage for the provider lifecycle state of each container.
 *
 * @internal
 */
const PROVISION_STATE: WeakMap<ContainerKernel, ProvisionState> = new WeakMap();

/**
 * Internal storage for the latest provider provision cycle ID per instance.
 *
 * @remarks
 * Kept per instance rather than on {@link ProvisionState} because it must
 * outlive a single provision cycle (it survives a `null` reset of
 * `WireStatus.provisionId` so reprovision keeps issuing unique IDs).
 *
 * @internal
 */
export const PROVISION_IDS_BY_INSTANCE: WeakMap<object, ProvisionId> = new WeakMap();

/**
 * Returns the provider lifecycle state for a container, if any exists.
 *
 * @group Container
 * @internal
 *
 * @param container - Container to inspect.
 * @returns The container's provision state, or `undefined` when never provisioned.
 */
export function getProvisionState(container: ContainerKernel): Maybe<ProvisionState> {
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
  let state: Maybe<ProvisionState> = PROVISION_STATE.get(container);

  if (!state) {
    state = { status: undefined, instances: null, tokensByInstance: new Map(), disposers: new Map() };
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
export function getContainerProvisionStatus(container: ContainerKernel): Definable<boolean> {
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
