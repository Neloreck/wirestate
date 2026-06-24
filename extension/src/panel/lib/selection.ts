import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsPluginInfo,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { findContainer } from "@/panel/lib/container-tree";
import { type Optional } from "@/types/general";

/**
 * The single entity selected in the Navigator, identified within its container. Bindings are the unit
 * of selection for everything a container resolves: a `Value` binding shows its value, and an
 * `Instance` binding shows its realized instance's live detail (status, handlers, state) inline — so
 * there is no separate "instance" selection.
 */
export type Selection =
  | { readonly kind: "container"; readonly containerId: number }
  | { readonly kind: "binding"; readonly containerId: number; readonly token: string }
  | { readonly kind: "plugin"; readonly containerId: number; readonly name: string };

/**
 * The entity a {@link Selection} resolves to against the current snapshot.
 */
export type ResolvedEntity =
  | { readonly kind: "container"; readonly container: DevtoolsContainerSnapshot }
  | { readonly kind: "binding"; readonly container: DevtoolsContainerSnapshot; readonly binding: DevtoolsBinding }
  | { readonly kind: "plugin"; readonly container: DevtoolsContainerSnapshot; readonly plugin: DevtoolsPluginInfo };

/**
 * True when two selections point at the same entity (used to detect a survived selection).
 *
 * @param first - First selection.
 * @param second - Second selection.
 * @returns Whether the two selections point at the same entity.
 */
export function isSameSelection(first: Selection, second: Selection): boolean {
  if (first.kind !== second.kind || first.containerId !== second.containerId) {
    return false;
  }

  switch (first.kind) {
    case "binding":
      return second.kind === "binding" && first.token === second.token;
    case "plugin":
      return second.kind === "plugin" && first.name === second.name;
    case "container":
      return true;
  }
}

/**
 * Resolves a selection to a live entity, or `undefined` when it is no longer in the snapshot.
 *
 * @param roots - The current root snapshots.
 * @param selection - The Navigator selection to resolve.
 * @returns The resolved entity, or `undefined` when the selection is no longer live.
 */
export function resolveSelection(
  roots: ReadonlyArray<DevtoolsRootSnapshot>,
  selection: Selection
): Optional<ResolvedEntity> {
  const container: Optional<DevtoolsContainerSnapshot> = findContainer(roots, selection.containerId);

  if (!container) {
    return undefined;
  }

  switch (selection.kind) {
    case "container":
      return { kind: "container", container };
    case "binding": {
      const binding: Optional<DevtoolsBinding> = container.bindings.find(
        (candidate) => candidate.token.name === selection.token
      );

      return binding ? { kind: "binding", container, binding } : undefined;
    }
    case "plugin": {
      const plugin: Optional<DevtoolsPluginInfo> = container.plugins.find(
        (candidate) => candidate.name === selection.name
      );

      return plugin ? { kind: "plugin", container, plugin } : undefined;
    }
  }
}

/**
 * The token name of the instance with the given id in a container — used to navigate from an
 * instance-anchored reference (a lifecycle delta, or a service field in the state tree) to the
 * binding that realizes it, since selection is now binding/token-centric.
 *
 * @param roots - The current root snapshots.
 * @param containerId - Container the instance lives in.
 * @param instanceId - The instance's stable id.
 * @returns The realizing binding's token name, or `undefined` when the instance is no longer live.
 */
export function getTokenOfInstanceId(
  roots: ReadonlyArray<DevtoolsRootSnapshot>,
  containerId: number,
  instanceId: number
): Optional<string> {
  const container: Optional<DevtoolsContainerSnapshot> = findContainer(roots, containerId);

  return container?.instances.find((instance) => instance.instanceId === instanceId)?.token.name;
}
