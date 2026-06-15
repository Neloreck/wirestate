import type { Container } from "../../container/container";
import type { ContainerKernel } from "../../container/container-kernel";
import type { Optional } from "../../types/general";
import type { WirestatePlugin } from "../plugin";
import { getOwnPlugins } from "../plugin-registry";

import {
  DEVTOOLS_PROTOCOL_VERSION,
  type DevtoolsContainerId,
  type DevtoolsContainerSnapshot,
  type DevtoolsHook,
  type DevtoolsInstance,
  type DevtoolsLifecyclePhase,
  type DevtoolsRootId,
  type DevtoolsRootSnapshot,
  installDevtoolsHook,
} from "./devtools-hook";
import { normalizeBinding, normalizeInstance, normalizePlugin } from "./devtools-normalize";
import { tapContainerBuses } from "./devtools-tap";

/**
 * Read-only observer plugin that exposes a container subtree to an inspector
 * backend (a Chrome extension or a standalone dev panel).
 *
 * @remarks
 * Installing this plugin is the **only** thing that puts the devtools hook on
 * `globalThis`; an application that never registers it has zero footprint and the
 * plugin tree-shakes away. Register it on a root container and, by plugin chain
 * inheritance, it observes the whole subtree — reconstructing the container tree
 * from the lifecycle stream rather than from reverse child-pointers.
 *
 * It owns nothing it observes: every container is held **weakly** (`WeakRef`), so
 * devtools never extends a container's lifetime and the panel reflects what the app
 * actually holds. A provisioned (mounted) container stays reachable because the app
 * holds it — whatever will `deprovision()` it pins it for the whole provision window —
 * and a container the app has dropped falls out of the next snapshot. Still
 * development-time only — the global hook and observation overhead are dev concerns.
 *
 * It observes both lifecycle (activation and provision) and messaging traffic —
 * events via a catch-all subscription, commands and queries by wrapping their
 * dispatch methods — and streams both as normalized deltas to the hook.
 *
 * @group DevTools
 *
 * @example
 * ```typescript
 * import { Container } from "@wirestate/core";
 * import { DevToolsPlugin } from "@wirestate/core/devtools";
 *
 * new Container({ plugins: [new DevToolsPlugin()] });
 * ```
 */
export class DevToolsPlugin implements WirestatePlugin {
  private hook: Optional<DevtoolsHook>;
  private rootId: DevtoolsRootId = 0;

  /**
   * Weak backstop for every observed container, keyed by id for dedupe. Never
   * extends a container's lifetime; dead entries are pruned lazily on snapshot.
   */
  private readonly observed: Map<DevtoolsContainerId, WeakRef<ContainerKernel>> = new Map();

  public install(container: Container): void {
    this.hook = installDevtoolsHook();
    this.track(this.hook.idForContainer(container), container);
    this.rootId = this.hook.registerRoot({ snapshot: () => this.snapshot() });
  }

  public onContainerProvision(container: Container): void {
    this.report(container, "containerProvision");
    this.tapMessages(container);
  }

  public onContainerDeprovision(container: Container): void {
    this.report(container, "containerDeprovision");
  }

  public onActivate(instance: object, container: Container): void {
    this.report(container, "activate", instance);
  }

  public onDeactivate(instance: object, container: Container): void {
    this.report(container, "deactivate", instance);
  }

  public onProvision(instance: object, container: Container): void {
    this.report(container, "provision", instance);
  }

  public onDeprovision(instance: object, container: Container): void {
    this.report(container, "deprovision", instance);
  }

  /**
   * Records the container weakly and emits one lifecycle delta to the hook.
   *
   * @param container - Container the phase fired on.
   * @param phase - Lifecycle phase being reported.
   * @param instance - The instance involved, for instance-level phases.
   */
  private report(container: Container, phase: DevtoolsLifecyclePhase, instance?: object): void {
    if (!this.hook) {
      return;
    }

    const containerId: DevtoolsContainerId = this.hook.idForContainer(container);

    this.track(containerId, container);

    this.hook.emit({
      kind: "lifecycle",
      rootId: this.rootId,
      containerId,
      phase,
      instance: instance && normalizeInstance(instance),
    });
  }

  /**
   * Taps the container's messaging buses so dispatches flow to the hook (idempotent).
   *
   * @param container - Container being provisioned.
   */
  private tapMessages(container: Container): void {
    if (!this.hook) {
      return;
    }

    const hook: DevtoolsHook = this.hook;
    const containerId: DevtoolsContainerId = hook.idForContainer(container);

    tapContainerBuses(container, (message) =>
      hook.emit({ kind: "message", rootId: this.rootId, containerId, message })
    );
  }

  /**
   * Records a weak reference to a container so it appears in snapshots while alive.
   *
   * @param containerId - Stable id of the container.
   * @param container - Container to track.
   */
  private track(containerId: DevtoolsContainerId, container: ContainerKernel): void {
    if (!this.observed.has(containerId)) {
      this.observed.set(containerId, new WeakRef(container));
    }
  }

  /**
   * Snapshots every still-live observed container, pruning ones the app has dropped.
   *
   * @returns The root snapshot.
   */
  private snapshot(): DevtoolsRootSnapshot {
    const containers: Array<DevtoolsContainerSnapshot> = [];

    for (const [containerId, reference] of this.observed) {
      const container: Optional<ContainerKernel> = reference.deref();

      if (container) {
        containers.push(this.snapshotContainer(container));
      } else {
        this.observed.delete(containerId);
      }
    }

    return { rootId: this.rootId, protocolVersion: DEVTOOLS_PROTOCOL_VERSION, containers };
  }

  /**
   * Snapshots one container's bindings and active instances.
   *
   * @param container - Container to snapshot.
   * @returns The container snapshot.
   */
  private snapshotContainer(container: ContainerKernel): DevtoolsContainerSnapshot {
    const hook: DevtoolsHook = this.hook as DevtoolsHook;
    const parent: Optional<ContainerKernel> = container.parent;
    const parentId: Optional<DevtoolsContainerId> = parent ? hook.idForContainer(parent) : undefined;

    return {
      containerId: hook.idForContainer(container),
      parentContainerId: parentId !== undefined && this.observed.has(parentId) ? parentId : null,
      bindings: container.getOwnBindings().map(normalizeBinding),
      instances: container
        .getActiveInstances()
        .map((instance: object): DevtoolsInstance => normalizeInstance(instance)),
      plugins: getOwnPlugins(container).map(normalizePlugin),
    };
  }
}
