import { type ContainerKernel } from "../container/container-kernel";
import { type Optional } from "../types/general";

/**
 * Provider ownership phase of a container.
 *
 * @group Container
 * @internal
 */
export type ProvisionPhase = "idle" | "provisioning" | "provisioned";

/**
 * What one provision cycle set up for one instance, so teardown can unwind exactly that.
 *
 * @remarks
 * Every flag is written when the corresponding setup step completes and read by the matching
 * teardown step. A cycle that aborts part-way therefore unwinds precisely what it reached.
 *
 * @group Container
 * @internal
 */
export interface ProvisionCycleEntry {
  /**
   * Whether the instance was resolved as a provider-lifecycle participant this cycle, so the cycle
   * runs its `@OnProvision` and owes it an `@OnDeprovision`.
   */
  participant: boolean;

  /**
   * Whether every plugin's `onProvision` ran for the instance, so teardown owes each of them an
   * `onDeprovision`.
   */
  wired: boolean;

  /**
   * Teardown callbacks plugins registered for the instance this cycle.
   */
  disposers: Array<() => void>;
}

/**
 * Provider lifecycle state owned by a single container.
 *
 * @remarks
 * One container is provisioned by at most one provider at a time, so this record is the single
 * source of truth for that container's provider ownership and for the cycle it currently holds.
 *
 * @group Container
 * @internal
 */
export interface ProvisionState {
  /**
   * Current provider ownership phase.
   */
  phase: ProvisionPhase;

  /**
   * Whether a deprovision transaction is currently unwinding this container or one of its
   * instances.
   *
   * @remarks
   * Keeps teardown callbacks from starting a second lifecycle pass. Stays `true` until every user
   * hook, plugin hook, and disposer of the active pass has run. Tracked apart from `phase`, because
   * unbinding one instance releases that instance while the container itself stays provisioned.
   */
  releasing: boolean;

  /**
   * Per-instance record of what the current cycle set up, keyed by instance.
   */
  cycle: Map<object, ProvisionCycleEntry>;
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
 * @returns The container's provision state, or `undefined` when it was never provisioned.
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
    state = { phase: "idle", releasing: false, cycle: new Map() };
    PROVISION_STATE.set(container, state);
  }

  return state;
}

/**
 * Returns the provider ownership phase of a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container to inspect.
 * @returns The current phase, or `undefined` when the container never entered provider lifecycle.
 */
export function getProvisionPhase(container: ContainerKernel): Optional<ProvisionPhase> {
  return PROVISION_STATE.get(container)?.phase;
}

/**
 * Returns whether a container is currently unwinding provider ownership.
 *
 * @group Container
 * @internal
 *
 * @param container - Container whose provider lifecycle is being inspected.
 * @returns Whether a provider-deprovision transaction currently owns teardown.
 */
export function isContainerDeprovisioning(container: ContainerKernel): boolean {
  return PROVISION_STATE.get(container)?.releasing ?? false;
}

/**
 * Returns the instances the current provision cycle resolved as provider-lifecycle participants.
 *
 * @group Container
 * @internal
 *
 * @param container - Container to inspect.
 * @returns The participants of the current cycle, empty when no cycle is held.
 */
export function getProvisionParticipants(container: ContainerKernel): ReadonlyArray<object> {
  const participants: Array<object> = [];

  for (const [instance, entry] of PROVISION_STATE.get(container)?.cycle ?? []) {
    if (entry.participant) {
      participants.push(instance);
    }
  }

  return participants;
}
