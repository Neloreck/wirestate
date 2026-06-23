import { isValueDescriptor } from "../../binding/binding-guards";
import { type Container } from "../../container/container";
import { type ContainerKernel } from "../../container/container-kernel";
import { type Optional } from "../../types/general";
import { type WirestatePlugin } from "../plugin";
import { getOwnPlugins } from "../plugin-registry";

import { DEVTOOLS_PROTOCOL_VERSION, installDevtoolsHook } from "./devtools-hook";
import {
  type DevtoolsBindingId,
  type DevtoolsContainerId,
  type DevtoolsContainerSnapshot,
  type DevtoolsHook,
  type DevtoolsInspectPath,
  type DevtoolsInstance,
  type DevtoolsInstanceId,
  type DevtoolsLifecyclePhase,
  type DevtoolsRootId,
  type DevtoolsRootSnapshot,
  type DevtoolsServiceRef,
} from "./devtools-hook.types";
import { normalizeBinding, normalizeInstance, normalizePlugin } from "./devtools-normalize";
import { tapContainerBuses } from "./devtools-tap";

/**
 * Configuration for {@link DevToolsPlugin}.
 *
 * @group DevTools
 */
export interface DevToolsPluginConfig {
  /**
   * Optional human label for this root, shown by the inspector to tell it apart from other roots on
   * the page (a root is otherwise identified only by a numeric id). When omitted, a consumer may
   * derive a hint from the root's contents instead.
   */
  readonly label?: string;
}

/**
 * Read-only observer plugin that exposes a container subtree to an inspector
 * backend (a Chrome extension or a standalone dev panel).
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

  /**
   * Optional human label for this root, surfaced in the snapshot. See {@link DevToolsPluginConfig.label}.
   */
  private readonly label: Optional<string>;

  /**
   * @param config - Optional plugin configuration (see {@link DevToolsPluginConfig}).
   */
  public constructor(config?: DevToolsPluginConfig) {
    this.label = config?.label;
  }

  public install(): void {
    this.hook = installDevtoolsHook();

    // Register exactly one root per plugin instance. A managed provider may `install`
    // the same instance on more than one container from one config — React StrictMode
    // double-invokes the `useState` initializer, constructing a throwaway alongside the
    // committed container — and only the committed one ever provisions.
    if (this.rootId === 0) {
      this.rootId = this.hook.registerRoot({
        snapshot: () => this.snapshot(),
        inspect: (instanceId, path) => this.inspect(instanceId, path),
        inspectBinding: (bindingId, path) => this.inspectBinding(bindingId, path),
        serviceRefOf: (value) => this.serviceRefOf(value),
      });
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
      timestamp: Date.now(),
      phase,
      instance: instance ? normalizeInstance(instance, this.hook.idForInstance(instance)) : undefined,
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
        hook.emit({ kind: "registration", rootId: this.rootId, containerId, timestamp: Date.now(), registration }),
      result: (result) =>
        hook.emit({ kind: "messageResult", rootId: this.rootId, containerId, timestamp: Date.now(), ...result }),
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

    return { rootId: this.rootId, protocolVersion: DEVTOOLS_PROTOCOL_VERSION, label: this.label, containers };
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
      bindings: container.getOwnBindings().map((binding) => normalizeBinding(binding, hook.idForBinding(binding))),
      instances: container
        .getActiveInstances()
        .map((instance: object): DevtoolsInstance => normalizeInstance(instance, hook.idForInstance(instance))),
      plugins: getOwnPlugins(container).map(normalizePlugin),
    };
  }

  /**
   * Reads the raw live value at `path` within the instance identified by `instanceId`, scanning the
   * observed containers' active instances. Read-only — never mutates.
   *
   * @param instanceId - Instance to read from.
   * @param path - Object keys / array indices from the instance to the value.
   * @returns The raw value, or `undefined` when the instance is not (or no longer) live.
   */
  private inspect(instanceId: DevtoolsInstanceId, path: DevtoolsInspectPath): unknown {
    if (!this.hook) {
      return undefined;
    }

    for (const reference of this.observed.values()) {
      const container: Optional<ContainerKernel> = reference.deref();

      if (!container) {
        continue;
      }

      for (const instance of container.getActiveInstances()) {
        if (this.hook.idForInstance(instance) === instanceId) {
          return readPath(instance, path);
        }
      }
    }

    return undefined;
  }

  /**
   * Reads the raw value at `path` within the `Value` binding identified by `bindingId`, scanning the
   * observed containers' own bindings. Reads the stored value directly — never resolves or constructs
   * — so it is side-effect-free and works even before the binding is first resolved. Only `Value`
   * bindings are addressable here; an `Instance`/`Factory` binding's id never matches.
   *
   * @param bindingId - Binding to read from.
   * @param path - Object keys / array indices from the binding's value to the target.
   * @returns The raw value at the path, or `undefined` when no live `Value` binding has that id.
   */
  private inspectBinding(bindingId: DevtoolsBindingId, path: DevtoolsInspectPath): unknown {
    if (!this.hook) {
      return undefined;
    }

    for (const reference of this.observed.values()) {
      const container: Optional<ContainerKernel> = reference.deref();

      if (!container) {
        continue;
      }

      for (const binding of container.getOwnBindings()) {
        if (isValueDescriptor(binding) && this.hook.idForBinding(binding) === bindingId) {
          return readPath(binding.value, path);
        }
      }
    }

    return undefined;
  }

  /**
   * If `value` is one of this root's tracked active instances, returns a reference to it (so the
   * inspector can mark a field that points at another service and offer a jump); else `undefined`.
   *
   * @param value - Raw value at an inspected field.
   * @returns A service reference, or `undefined`.
   */
  private serviceRefOf(value: object): Optional<DevtoolsServiceRef> {
    if (!this.hook) {
      return undefined;
    }

    for (const reference of this.observed.values()) {
      const container: Optional<ContainerKernel> = reference.deref();

      if (!container) {
        continue;
      }

      for (const instance of container.getActiveInstances()) {
        if (instance === value) {
          return {
            instanceId: this.hook.idForInstance(instance),
            containerId: this.hook.idForContainer(container),
            className: instance.constructor.name,
          };
        }
      }
    }

    return undefined;
  }
}

/**
 * Walks object keys / array indices from a root value, returning the value at the path — or
 * `undefined` if a step is missing or its getter throws (a getter must never crash devtools).
 *
 * @param root - Value to walk from.
 * @param path - Keys / indices to follow.
 * @returns The value at the path.
 */
function readPath(root: unknown, path: DevtoolsInspectPath): unknown {
  let current: unknown = root;

  for (const key of path) {
    if (current === null || (typeof current !== "object" && typeof current !== "function")) {
      return undefined;
    }

    try {
      current = (current as Record<PropertyKey, unknown>)[key];
    } catch {
      return undefined;
    }
  }

  return current;
}
