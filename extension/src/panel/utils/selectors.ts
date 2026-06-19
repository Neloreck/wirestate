import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsMessageChannel,
  type DevtoolsMessageResultEvent,
  type DevtoolsPluginInfo,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { type Selection, type TimelineFilter } from "@/panel/types";
import { summarize } from "@/panel/utils/format";
import { type Optional } from "@/types/general";

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

    const build = (container: DevtoolsContainerSnapshot): ContainerNodeModel => ({
      rootId: root.rootId,
      container,
      children: (byParent.get(container.containerId) ?? []).map(build),
    });

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

/**
 * Whether a binding can ever be realized by a single container-tracked instance — true only for a
 * singleton `Instance` binding. A `Value` binding is a constant, a `Factory` produces values the
 * container doesn't track, and a `Transient` binding yields a fresh instance per resolution (no
 * single "the" instance), so "realized by" is meaningless for those.
 *
 * @param binding - The binding to classify.
 * @returns `true` when a singleton instance binding, else `false`.
 */
export function mayRealizeInstance(binding: DevtoolsBinding): boolean {
  return binding.type === "Instance" && binding.scope === "Singleton";
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
 * The channel a delta flowed through, or `undefined` for lifecycle deltas.
 *
 * @param event - The devtools delta to read.
 * @returns The message/registration channel, or `undefined` for a lifecycle delta.
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
 * Lifecycle deltas for one container, optionally narrowed to one instance. Narrowing prefers the
 * exact `instanceId`, falling back to `className` when the target has no id (an older core that
 * predates the instance handle — target and deltas come from the same core, so either both carry
 * ids or neither does).
 *
 * @param log - The delta buffer to filter.
 * @param containerId - The container whose lifecycle deltas to keep.
 * @param instance - Optional instance to narrow to.
 * @param instance.instanceId - The instance's stable id, preferred when present.
 * @param instance.className - The instance's class name, used when no id is available.
 * @returns The matching lifecycle deltas, in arrival order.
 */
export function lifecycleHistory(
  log: ReadonlyArray<DevtoolsEvent>,
  containerId: number,
  instance?: { readonly instanceId?: number; readonly className?: string }
): ReadonlyArray<DevtoolsEvent> {
  return log.filter((event) => {
    if (event.kind !== "lifecycle" || event.containerId !== containerId) {
      return false;
    }

    if (!instance) {
      return true;
    }

    const subject = event.instance;

    if (!subject) {
      return false;
    }

    return instance.instanceId !== undefined
      ? subject.instanceId === instance.instanceId
      : subject.className === instance.className;
  });
}

/**
 * Applies the Timeline filter to the delta log.
 *
 * @param log - The full delta log.
 * @param filter - The active Timeline filter.
 * @returns The deltas that pass every filter dimension.
 */
export function filterLog(log: ReadonlyArray<DevtoolsEvent>, filter: TimelineFilter): ReadonlyArray<DevtoolsEvent> {
  const needle: string = filter.text.trim().toLowerCase();

  return log.filter((event) => {
    // Result deltas aren't standalone rows — they attach to their message's accordion.
    if (event.kind === "messageResult") {
      return false;
    }

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

/**
 * Indexes the log's message-result deltas by the id of the message they correlate to, so a message
 * row can render its result inline. Last result wins when an id repeats.
 *
 * @param log - The delta log to index.
 * @returns A map from message id to its result delta.
 */
export function buildMessageResults(
  log: ReadonlyArray<DevtoolsEvent>
): ReadonlyMap<number, DevtoolsMessageResultEvent> {
  const results: Map<number, DevtoolsMessageResultEvent> = new Map();

  for (const event of log) {
    if (event.kind === "messageResult") {
      results.set(event.messageId, event);
    }
  }

  return results;
}
