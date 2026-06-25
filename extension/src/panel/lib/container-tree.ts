import { type DevtoolsContainerSnapshot, type DevtoolsRootSnapshot } from "#/devtools";

import { type Optional } from "@/types/general";

/**
 * One container plus its nested child containers, for the Navigator tree.
 */
export interface ContainerNodeModel {
  readonly rootId: number;
  readonly container: DevtoolsContainerSnapshot;
  readonly children: ReadonlyArray<ContainerNodeModel>;
}

/**
 * A root with a derived display label and its top-level container nodes.
 */
export interface RootModel {
  readonly rootId: number;
  readonly label: string;
  readonly nodes: ReadonlyArray<ContainerNodeModel>;
}

/**
 * Nests each root's flat container list into a forest by `parentContainerId`.
 *
 * @param roots - The flat root snapshots from the devtools hook.
 * @returns One model per root, each with a derived label and its top-level container nodes.
 */
export function buildRoots(roots: ReadonlyArray<DevtoolsRootSnapshot>): ReadonlyArray<RootModel> {
  return roots.map((root) => {
    const byParent: Map<number | null, Array<DevtoolsContainerSnapshot>> = new Map();
    const ids: Set<number> = new Set(root.containers.map((container) => container.containerId));

    for (const container of root.containers) {
      const siblings: Array<DevtoolsContainerSnapshot> = byParent.get(container.parentContainerId) ?? [];

      siblings.push(container);
      byParent.set(container.parentContainerId, siblings);
    }

    function build(container: DevtoolsContainerSnapshot): ContainerNodeModel {
      return {
        rootId: root.rootId,
        container,
        children: (byParent.get(container.containerId) ?? []).map(build),
      };
    }

    // Top-level = no parent, or a parent that isn't in this root's observed set.
    const tops: ReadonlyArray<DevtoolsContainerSnapshot> = root.containers.filter(
      (container) => container.parentContainerId === null || !ids.has(container.parentContainerId)
    );

    return { rootId: root.rootId, label: root.label ?? rootLabel(root), nodes: tops.map(build) };
  });
}

/**
 * Derives a human hint for a root, which v1 identifies only by a numeric id.
 *
 * @param root - The root snapshot to label.
 * @returns A short label combining the root id, container count, and first class names.
 */
function rootLabel(root: DevtoolsRootSnapshot): string {
  const count: number = root.containers.length;
  const names: string = root.containers
    .flatMap((container) => container.instances.map((instance) => instance.className))
    .slice(0, 2)
    .join(", ");

  return `#${root.rootId} · ${count} container${count === 1 ? "" : "s"}${names ? ` · ${names}` : ""}`;
}

/**
 * Finds a container by id across all roots.
 *
 * @param roots - The root snapshots to search.
 * @param containerId - The container id to find.
 * @returns The matching container snapshot, or `undefined` when none has that id.
 */
export function findContainer(
  roots: ReadonlyArray<DevtoolsRootSnapshot>,
  containerId: number
): Optional<DevtoolsContainerSnapshot> {
  for (const root of roots) {
    for (const container of root.containers) {
      if (container.containerId === containerId) {
        return container;
      }
    }
  }

  return undefined;
}

/**
 * The id of the root whose observed set contains the given container, or `undefined`.
 *
 * @param roots - The root snapshots to search.
 * @param containerId - The container id to locate.
 * @returns The owning root's id, or `undefined` when no root observes the container.
 */
export function rootIdOfContainer(roots: ReadonlyArray<DevtoolsRootSnapshot>, containerId: number): Optional<number> {
  return roots.find((root) => root.containers.some((container) => container.containerId === containerId))?.rootId;
}

/**
 * Containers whose parent is the given container (derived child links).
 *
 * @param roots - The root snapshots to search.
 * @param containerId - The parent container id.
 * @returns The direct child containers, in observed order.
 */
export function childContainers(
  roots: ReadonlyArray<DevtoolsRootSnapshot>,
  containerId: number
): ReadonlyArray<DevtoolsContainerSnapshot> {
  const children: Array<DevtoolsContainerSnapshot> = [];

  for (const root of roots) {
    for (const container of root.containers) {
      if (container.parentContainerId === containerId) {
        children.push(container);
      }
    }
  }

  return children;
}
