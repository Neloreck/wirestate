import { BindingScope, BindingType } from "@wirestate/core";

import { type DevtoolsBinding, type DevtoolsContainerSnapshot, type DevtoolsInstance } from "#/devtools";

import { type Optional } from "@/types/general";

/**
 * Whether a binding can ever be realized by a single container-tracked instance.
 *
 * @param binding - The binding to classify.
 * @returns `true` when a singleton instance binding, else `false`.
 */
export function mayRealizeInstance(binding: DevtoolsBinding): boolean {
  return binding.type === BindingType.Instance && binding.scope === BindingScope.Singleton;
}

/**
 * The instance that realizes a binding, if one is active in the same container.
 *
 * @param container - The container whose active instances to search.
 * @param binding - The binding to resolve to an instance.
 * @returns The realizing instance, or `undefined` when none is active.
 */
export function realizingInstance(
  container: DevtoolsContainerSnapshot,
  binding: DevtoolsBinding
): Optional<DevtoolsInstance> {
  return container.instances.find(
    (instance) =>
      instance.token.name === binding.token.name ||
      (binding.implementation !== undefined && instance.className === binding.implementation)
  );
}

/**
 * The lifecycle tag shown next to a binding in the token-centric view.
 */
export enum BindingStatus {
  Active = "active",
  Inactive = "inactive",
  Unrealized = "unrealized",
  None = "none",
}

/**
 * Classifies a binding into its lifecycle tag for the Detail pane.
 *
 * @param container - Container the binding belongs to.
 * @param binding - The binding to classify.
 * @returns The lifecycle tag for the binding row.
 */
export function getBindingStatus(container: DevtoolsContainerSnapshot, binding: DevtoolsBinding): BindingStatus {
  if (!mayRealizeInstance(binding)) {
    return BindingStatus.None;
  }

  const instance: Optional<DevtoolsInstance> = realizingInstance(container, binding);

  if (!instance) {
    return BindingStatus.Unrealized;
  }

  return instance.status?.isInactive ? BindingStatus.Inactive : BindingStatus.Active;
}
