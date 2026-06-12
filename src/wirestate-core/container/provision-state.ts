import type { Identifier } from "../binding/binding-tokens";

import type { Container } from "./container";
import type { ContainerKernel } from "./container-kernel";
import type { ProvisionId } from "./wire-status";

/**
 * Represents provider lifecycle state keyed by container.
 *
 * Framework adapters keep one map per provider tree.
 *
 * @group Container
 */
export type ContainerProvisionLifecycle = Map<Container, Array<object>>;

/**
 * Internal storage for unbind interceptor removers registered while a provider
 * lifecycle owns a container, keyed by container and lifecycle.
 *
 * @internal
 */
export const UNBIND_INTERCEPTOR_REMOVERS: WeakMap<
  ContainerKernel,
  Map<ContainerProvisionLifecycle, () => void>
> = new WeakMap();

/**
 * Internal storage for provider lifecycle maps that currently own a container.
 *
 * @internal
 */
export const PROVISION_LIFECYCLES_BY_CONTAINER: WeakMap<
  ContainerKernel,
  Set<ContainerProvisionLifecycle>
> = new WeakMap();

/**
 * Internal storage for provider lifecycle tokens represented by an instance.
 *
 * @internal
 */
export const PROVISION_TOKENS_BY_INSTANCE: WeakMap<object, Set<Identifier>> = new WeakMap();

/**
 * Internal storage for the latest provider provision cycle ID per instance.
 *
 * @internal
 */
export const PROVISION_IDS_BY_INSTANCE: WeakMap<object, ProvisionId> = new WeakMap();

/**
 * Internal storage for current provider ownership state keyed by container.
 *
 * Tri-state: `true` while provider-owned, `false` after deprovisioning, and
 * absent for containers that never entered provider ownership.
 */
const PROVISION_STATUS_BY_CONTAINER: WeakMap<ContainerKernel, boolean> = new WeakMap();

/**
 * Stores the provider ownership state for a container.
 *
 * @group Container
 * @internal
 *
 * @param container - ContainerKernel entering or leaving provider ownership.
 * @param provisioned - `true` when provisioned, `false` when deprovisioned.
 */
export function setContainerProvisioned(container: ContainerKernel, provisioned: boolean): void {
  PROVISION_STATUS_BY_CONTAINER.set(container, provisioned);
}

/**
 * Resets the provider ownership state for a container to never-provisioned.
 *
 * @group Container
 * @internal
 *
 * @param container - ContainerKernel whose ownership state is reset.
 */
export function clearContainerProvisionStatus(container: ContainerKernel): void {
  PROVISION_STATUS_BY_CONTAINER.delete(container);
}

/**
 * Returns the provider ownership state for a container.
 *
 * @group Container
 * @internal
 *
 * @param container - ContainerKernel to inspect.
 * @returns `true` while provider-owned, `false` after deprovisioning, or
 * `undefined` when the container never entered provider ownership.
 */
export function getContainerProvisionStatus(container: ContainerKernel): boolean | undefined {
  return PROVISION_STATUS_BY_CONTAINER.get(container);
}
