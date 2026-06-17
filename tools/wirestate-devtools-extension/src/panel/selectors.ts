import type {
  DevtoolsBinding,
  DevtoolsContainerSnapshot,
  DevtoolsEvent,
  DevtoolsInstance,
  DevtoolsMessageChannel,
  DevtoolsPluginInfo,
  DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { summarize } from "@/panel/format";
import type { Selection, TimelineFilter } from "@/panel/types";
import type { Optional } from "@/types/general";

/** One container plus its nested child containers, for the Navigator tree. */
export interface ContainerNodeModel {
  readonly rootId: number;
  readonly container: DevtoolsContainerSnapshot;
  readonly children: ReadonlyArray<ContainerNodeModel>;
}

/** A root with a derived display label and its top-level container nodes. */
export interface RootModel {
  readonly rootId: number;
  readonly label: string;
  readonly nodes: ReadonlyArray<ContainerNodeModel>;
}

/** The entity a {@link Selection} resolves to against the current snapshot. */
export type ResolvedEntity =
  | { readonly kind: "container"; readonly container: DevtoolsContainerSnapshot }
  | { readonly kind: "instance"; readonly container: DevtoolsContainerSnapshot; readonly instance: DevtoolsInstance }
  | { readonly kind: "binding"; readonly container: DevtoolsContainerSnapshot; readonly binding: DevtoolsBinding }
  | { readonly kind: "plugin"; readonly container: DevtoolsContainerSnapshot; readonly plugin: DevtoolsPluginInfo };

/**
 * Nests each root's flat container list into a forest by `parentContainerId`.
 *
 * @param roots
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

    const build = (container: DevtoolsContainerSnapshot): ContainerNodeModel => ({
      rootId: root.rootId,
      container,
      children: (byParent.get(container.containerId) ?? []).map(build),
    });

    // Top-level = no parent, or a parent that isn't in this root's observed set.
    const tops: ReadonlyArray<DevtoolsContainerSnapshot> = root.containers.filter(
      (container) => container.parentContainerId === null || !ids.has(container.parentContainerId)
    );

    return { rootId: root.rootId, label: rootLabel(root), nodes: tops.map(build) };
  });
}

/**
 * Derives a human hint for a root, which v1 identifies only by a numeric id.
 *
 * @param root
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
 * @param roots
 * @param containerId
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
 * Resolves a selection to a live entity, or `undefined` when it is no longer in the snapshot.
 *
 * @param roots
 * @param selection
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
    case "instance": {
      const instance: Optional<DevtoolsInstance> = container.instances.find(
        (candidate) => candidate.className === selection.className
      );

      return instance ? { kind: "instance", container, instance } : undefined;
    }
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
 * Containers whose parent is the given container (derived child links).
 *
 * @param roots
 * @param containerId
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

/**
 * The instance that realizes a binding, if one is active in the same container.
 *
 * @param container
 * @param binding
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
 * The channel a delta flowed through, or `undefined` for lifecycle deltas.
 *
 * @param event
 */
export function channelOf(event: DevtoolsEvent): Optional<DevtoolsMessageChannel> {
  if (event.kind === "message") {
    return event.message.channel;
  }

  if (event.kind === "registration") {
    return event.registration.channel;
  }

  return undefined;
}

/**
 * Lifecycle deltas for one container (and one instance, when a class name is given).
 *
 * @param log
 * @param containerId
 * @param className
 */
export function lifecycleHistory(
  log: ReadonlyArray<DevtoolsEvent>,
  containerId: number,
  className?: string
): ReadonlyArray<DevtoolsEvent> {
  return log.filter(
    (event) =>
      event.kind === "lifecycle" &&
      event.containerId === containerId &&
      (className === undefined || event.instance?.className === className)
  );
}

/**
 * Applies the Timeline filter to the delta log.
 *
 * @param log
 * @param filter
 */
export function filterLog(log: ReadonlyArray<DevtoolsEvent>, filter: TimelineFilter): ReadonlyArray<DevtoolsEvent> {
  const needle: string = filter.text.trim().toLowerCase();

  return log.filter((event) => {
    if (!filter.kinds[event.kind]) {
      return false;
    }

    if (filter.rootId !== undefined && event.rootId !== filter.rootId) {
      return false;
    }

    if (filter.containerId !== undefined && event.containerId !== filter.containerId) {
      return false;
    }

    const channel: Optional<DevtoolsMessageChannel> = channelOf(event);

    if (channel !== undefined && !filter.channels[channel]) {
      return false;
    }

    return needle === "" || summarize(event).toLowerCase().includes(needle);
  });
}
