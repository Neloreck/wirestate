import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsLifecycleEvent,
  type DevtoolsMessage,
  type DevtoolsMessageEvent,
  type DevtoolsMessageResultEvent,
  type DevtoolsPluginInfo,
  type DevtoolsRegistration,
  type DevtoolsRegistrationEvent,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

/**
 * Builds a minimal service instance snapshot for devtools tests.
 *
 * @param className - Display class name for the instance.
 * @param token - Token name associated with the instance.
 * @param instanceId - Stable instance identifier.
 * @returns A devtools instance with no status or registered handlers.
 */
export function mockInstance(
  className: string = "Service",
  token: string = className,
  instanceId: number = 1
): DevtoolsInstance {
  return { instanceId, token: { name: token, kind: "class" }, className, status: undefined, handlers: [] };
}

/**
 * Builds a singleton instance binding snapshot for devtools tests.
 *
 * @param name - Token name associated with the binding.
 * @param implementation - Optional implementation display name.
 * @returns A devtools binding descriptor.
 */
export function mockBinding(name: string = "Service", implementation?: string): DevtoolsBinding {
  return { token: { name, kind: "class" }, type: "Instance", scope: "Singleton", implementation };
}

/**
 * Builds plugin metadata for a devtools snapshot.
 *
 * @param name - Plugin display name.
 * @returns Plugin info with no handled channels.
 */
export function mockPluginInfo(name: string = "Plugin"): DevtoolsPluginInfo {
  return { name, handles: [] };
}

/**
 * Builds a container snapshot with empty binding, instance, and plugin collections by default.
 *
 * @param containerId - Snapshot container identifier.
 * @param parentContainerId - Parent container identifier, or `null` for a root container.
 * @param extra - Snapshot fields to override or extend.
 * @returns A devtools container snapshot.
 */
export function mockContainerSnapshot(
  containerId: number = 1,
  parentContainerId: number | null = null,
  extra: Partial<DevtoolsContainerSnapshot> = {}
): DevtoolsContainerSnapshot {
  return { containerId, parentContainerId, bindings: [], instances: [], plugins: [], ...extra };
}

/**
 * Builds a root snapshot containing the supplied container snapshots.
 *
 * @param rootId - Snapshot root identifier.
 * @param containers - Containers included under the root.
 * @param label - Optional root display label.
 * @returns A devtools root snapshot using protocol version 1.
 */
export function mockRootSnapshot(
  rootId: number = 1,
  containers: ReadonlyArray<DevtoolsContainerSnapshot> = [],
  label?: string
): DevtoolsRootSnapshot {
  return { rootId, protocolVersion: 1, label, containers };
}

/**
 * Builds a message delta event with a default event-channel message.
 *
 * @param overrides - Event and nested message fields to override.
 * @returns A devtools message event.
 */
export function mockMessageEvent(
  overrides: Partial<Omit<DevtoolsMessageEvent, "kind" | "message">> & {
    readonly message?: Partial<DevtoolsMessage>;
  } = {}
): DevtoolsEvent {
  return {
    kind: "message",
    rootId: overrides.rootId ?? 1,
    containerId: overrides.containerId ?? 1,
    message: {
      id: 0,
      channel: "event",
      type: "Message",
      payload: null,
      source: undefined,
      timestamp: 0,
      ...overrides.message,
    },
  };
}

/**
 * Builds a lifecycle delta event.
 *
 * @param overrides - Event fields and optional instance data to override.
 * @returns A devtools lifecycle event.
 */
export function mockLifecycleEvent(
  overrides: Partial<Omit<DevtoolsLifecycleEvent, "kind" | "instance">> & {
    readonly className?: string;
    readonly instance?: DevtoolsInstance;
  } = {}
): DevtoolsEvent {
  return {
    kind: "lifecycle",
    rootId: overrides.rootId ?? 1,
    containerId: overrides.containerId ?? 1,
    timestamp: overrides.timestamp ?? 0,
    phase: overrides.phase ?? "activate",
    instance: overrides.instance ?? (overrides.className !== undefined ? mockInstance(overrides.className) : undefined),
  };
}

/**
 * Builds a lifecycle delta shaped like older core payloads that did not stamp a top-level timestamp.
 *
 * @param overrides - Event fields to override.
 * @returns A devtools lifecycle event without a runtime timestamp field.
 */
export function mockLifecycleEventWithoutTimestamp(
  overrides: Partial<Pick<DevtoolsLifecycleEvent, "rootId" | "containerId" | "phase">> = {}
): DevtoolsEvent {
  return {
    kind: "lifecycle",
    rootId: overrides.rootId ?? 1,
    containerId: overrides.containerId ?? 1,
    phase: overrides.phase ?? "activate",
    instance: undefined,
  } as unknown as DevtoolsEvent;
}

/**
 * Builds a handler registration delta event.
 *
 * @param overrides - Event and nested registration fields to override.
 * @returns A devtools registration event.
 */
export function mockRegistrationEvent(
  overrides: Partial<Omit<DevtoolsRegistrationEvent, "kind" | "registration">> & {
    readonly registration?: Partial<DevtoolsRegistration>;
  } = {}
): DevtoolsEvent {
  return {
    kind: "registration",
    rootId: overrides.rootId ?? 1,
    containerId: overrides.containerId ?? 1,
    timestamp: overrides.timestamp ?? 0,
    registration: { channel: "event", type: "Message", phase: "registered", ...overrides.registration },
  };
}

/**
 * Builds a message result delta event.
 *
 * @param overrides - Event, message result, and value fields to override.
 * @returns A devtools message result event.
 */
export function mockMessageResultEvent(
  overrides: Partial<Omit<DevtoolsMessageResultEvent, "kind">> = {}
): DevtoolsEvent {
  return {
    kind: "messageResult",
    messageId: overrides.messageId ?? 0,
    outcome: overrides.outcome ?? "resolved",
    value: overrides.value,
    rootId: overrides.rootId ?? 1,
    containerId: overrides.containerId ?? 1,
    timestamp: overrides.timestamp ?? 0,
  };
}
