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
 * inheritance, it observes the whole subtree — reconstructing the container tree from
 * the lifecycle stream rather than from reverse child-pointers.
 *
 * It owns nothing it observes: every live container is held **weakly** (`WeakRef`), so
 * devtools never extends a container's lifetime. The tree tracks **currently-provisioned**
 * containers — added when a container provisions, removed when it deprovisions — so a
 * container the app has torn down, or a **discarded render** (e.g. a React StrictMode
 * throwaway that constructs but never commits), never appears. Exactly **one root** is
 * registered per plugin instance, even when a managed provider constructs more than one
 * container from the same config. Development-time only.
 *
 * It observes both lifecycle (activation and provision) and messaging traffic — events
 * via a catch-all subscription, commands and queries by wrapping their dispatch methods —
 * and streams both as normalized deltas to the hook.
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
   * Currently-provisioned (live) containers, keyed by id for dedupe and held weakly so
   * the plugin never extends a container's lifetime. Populated on provision, drained on
   * deprovision; dead entries are pruned lazily on snapshot as a backstop.
   */
  private readonly observed: Map<DevtoolsContainerId, WeakRef<ContainerKernel>> = new Map();

  public install(): void {
    this.hook = installDevtoolsHook();

    // Register exactly one root per plugin instance. A managed provider may `install`
    // the same instance on more than one container from one config — React StrictMode
    // double-invokes the `useState` initializer, constructing a throwaway alongside the
    // committed container — and only the committed one ever provisions.
    if (this.rootId === 0) {
      this.rootId = this.hook.registerRoot({ snapshot: () => this.snapshot() });
    }
  }

  public onContainerProvision(container: Container): void {
    this.observe(container);
    this.report(container, "containerProvision");
    this.tapMessages(container);
  }

  public onContainerDeprovision(container: Container): void {
    this.report(container, "containerDeprovision");
    this.unobserve(container);
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
   * Emits one lifecycle delta to the hook.
   *
   * @param container - Container the phase fired on.
   * @param phase - Lifecycle phase being reported.
   * @param instance - The instance involved, for instance-level phases.
   */
  private report(container: Container, phase: DevtoolsLifecyclePhase, instance?: object): void {
    if (!this.hook) {
      return;
    }

    this.hook.emit({
      kind: "lifecycle",
      rootId: this.rootId,
      containerId: this.hook.idForContainer(container),
      phase,
      instance: instance && normalizeInstance(instance),
    });
  }

  /**
   * Taps the container's messaging buses so dispatches and handler registrations flow to
   * the hook (idempotent).
   *
   * @param container - Container being provisioned.
   */
  private tapMessages(container: Container): void {
    if (!this.hook) {
      return;
    }

    const hook: DevtoolsHook = this.hook;
    const containerId: DevtoolsContainerId = hook.idForContainer(container);

    tapContainerBuses(container, {
      message: (message) => hook.emit({ kind: "message", rootId: this.rootId, containerId, message }),
      registration: (registration) =>
        hook.emit({ kind: "registration", rootId: this.rootId, containerId, registration }),
    });
  }

  /**
   * Adds a provisioned container to the live set so it appears in snapshots.
   *
   * @param container - Container that just provisioned.
   */
  private observe(container: ContainerKernel): void {
    if (!this.hook) {
      return;
    }

    const containerId: DevtoolsContainerId = this.hook.idForContainer(container);

    if (!this.observed.has(containerId)) {
      this.observed.set(containerId, new WeakRef(container));
    }
  }

  /**
   * Removes a container from the live set when it deprovisions, so a torn-down (or
   * discarded) container drops out of snapshots immediately.
   *
   * @param container - Container that just deprovisioned.
   */
  private unobserve(container: ContainerKernel): void {
    if (!this.hook) {
      return;
    }

    this.observed.delete(this.hook.idForContainer(container));
  }

  /**
   * Snapshots every still-live observed container, pruning any the app has dropped.
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
