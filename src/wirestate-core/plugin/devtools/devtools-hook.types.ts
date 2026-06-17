import type { Nullable, Optional } from "../../types/general";

/**
 * Identifier for one registered root (one installed {@link DevToolsPlugin}).
 *
 * @group DevTools
 */
export type DevtoolsRootId = number;
/**
 * Identifier for one container within a root's subtree. Stable for a container's
 * lifetime and shared across roots that observe the same container.
 *
 * @group DevTools
 */
export type DevtoolsContainerId = number;
/**
 * Identifier for one service instance. Stable for the instance's lifetime and unique within (and
 * across) containers. The target of on-demand inspection and the key for exact event↔instance
 * correlation.
 *
 * @group DevTools
 */
export type DevtoolsInstanceId = number;

/**
 * Normalized, display-ready description of a binding token.
 *
 * @group DevTools
 */
export interface DevtoolsToken {
  /**
   * Human-readable token label (class name, symbol description, or token string).
   */
  readonly name: string;

  /**
   * Underlying token category, for icon/grouping in the panel.
   */
  readonly kind: "class" | "string" | "symbol" | "injectionToken";
}

/**
 * Normalized description of one binding registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsBinding {
  /**
   * Token the binding is registered under.
   */
  readonly token: DevtoolsToken;

  /**
   * Construction strategy.
   */
  readonly type: "Value" | "Instance" | "Factory";

  /**
   * Lifetime scope.
   */
  readonly scope: "Singleton" | "Transient";

  /**
   * Implementation class name for instance bindings; absent otherwise.
   */
  readonly implementation: Optional<string>;
}

/**
 * Normalized snapshot of a service instance's lifecycle status.
 *
 * @group DevTools
 */
export interface DevtoolsInstanceStatus {
  /**
   * Whether the instance was deactivated and removed from its container.
   */
  readonly isDeactivated: boolean;

  /**
   * Provider-ownership state: `null` not yet provisioned, `false` owned, `true` deprovisioned.
   */
  readonly isDeprovisioned: Nullable<boolean>;

  /**
   * Whether the instance's lifecycle has ended (derived).
   */
  readonly isInactive: boolean;

  /**
   * Current provider provision-cycle id, or `null` outside a cycle.
   */
  readonly provisionId: Nullable<number>;
}

/**
 * A message handler/subscriber a service declares via `@OnEvent` / `@OnCommand` /
 * `@OnQuery`.
 *
 * @remarks
 * Reflects **declared** (decorated) handlers only; handlers registered imperatively
 * (`bus.register` / `bus.subscribe`) are not included.
 *
 * @group DevTools
 */
export interface DevtoolsHandler {
  /**
   * Channel the handler is on.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Stringified message type the handler covers; `"*"` for a catch-all event handler.
   */
  readonly type: string;

  /**
   * Handler method name on the service.
   */
  readonly method: string;
}

/**
 * Normalized description of one active service instance.
 *
 * @group DevTools
 */
export interface DevtoolsInstance {
  /**
   * Stable id for this instance — the target of on-demand inspection and the key for exact
   * event↔instance correlation.
   */
  readonly instanceId: DevtoolsInstanceId;

  /**
   * Token the instance was resolved under.
   */
  readonly token: DevtoolsToken;

  /**
   * Concrete class name of the instance.
   */
  readonly className: string;

  /**
   * Lifecycle status, or `undefined` when the instance is not tracked.
   */
  readonly status: Optional<DevtoolsInstanceStatus>;

  /**
   * Message handlers/subscribers this instance declares (decorated handlers only).
   */
  readonly handlers: ReadonlyArray<DevtoolsHandler>;
}

/**
 * Normalized description of one plugin registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsPluginInfo {
  /**
   * Plugin class name (for example `"EventsPlugin"` or `"DevToolsPlugin"`).
   */
  readonly name: string;

  /**
   * Messaging-handler kind descriptions the plugin owns; empty for pure observers.
   */
  readonly handles: ReadonlyArray<string>;
}

/**
 * Normalized snapshot of one container.
 *
 * @group DevTools
 */
export interface DevtoolsContainerSnapshot {
  /**
   * Stable id of this container.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Parent container's id, or `null` for a root container.
   */
  readonly parentContainerId: Nullable<DevtoolsContainerId>;

  /**
   * Bindings registered directly on this container, in registration order.
   */
  readonly bindings: ReadonlyArray<DevtoolsBinding>;

  /**
   * Active service instances this container constructed, in creation order.
   */
  readonly instances: ReadonlyArray<DevtoolsInstance>;

  /**
   * Plugins registered directly on this container (own, not inherited).
   */
  readonly plugins: ReadonlyArray<DevtoolsPluginInfo>;
}

/**
 * Full snapshot of one root: every container observed under it.
 *
 * @group DevTools
 */
export interface DevtoolsRootSnapshot {
  /**
   * The root this snapshot belongs to.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Protocol version the snapshot was produced with.
   */
  readonly protocolVersion: number;

  /**
   * Every container observed under this root, root container first.
   */
  readonly containers: ReadonlyArray<DevtoolsContainerSnapshot>;

  /**
   * Optional human label for the root, set via `new DevToolsPlugin({ label })`; `undefined` when
   * the app did not name it (a consumer may derive a hint instead).
   */
  readonly label: Optional<string>;
}

/**
 * Lifecycle phase a {@link DevtoolsLifecycleEvent} reports.
 *
 * @group DevTools
 */
export type DevtoolsLifecyclePhase =
  | "containerProvision"
  | "containerDeprovision"
  | "activate"
  | "deactivate"
  | "provision"
  | "deprovision";

/**
 * A container/instance lifecycle delta.
 *
 * @group DevTools
 */
export interface DevtoolsLifecycleEvent {
  /**
   * Discriminant.
   */
  readonly kind: "lifecycle";

  /**
   * Root the event originated from.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Container the event applies to.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Epoch milliseconds when the delta was emitted.
   */
  readonly timestamp: number;

  /**
   * Which lifecycle phase fired.
   */
  readonly phase: DevtoolsLifecyclePhase;

  /**
   * The instance the event applies to, or `undefined` for container-boundary phases.
   */
  readonly instance: Optional<DevtoolsInstance>;
}

/**
 * Messaging channel a {@link DevtoolsMessage} flowed through.
 *
 * @group DevTools
 */
export type DevtoolsMessageChannel = "event" | "command" | "query";

/**
 * One observed message: an event emitted, or a command/query dispatched.
 *
 * @remarks
 * `payload` and `source` are the **raw** in-page values — the in-page backend
 * serializes them when bridging to the panel.
 *
 * @group DevTools
 */
export interface DevtoolsMessage {
  /**
   * Correlation id, unique per dispatch; a {@link DevtoolsMessageResultEvent} references it via
   * `messageId`. Events carry an id too, but never produce a result.
   */
  readonly id: number;

  /**
   * Which bus the message flowed through.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Stringified message type (event type, command type, or query type).
   */
  readonly type: string;

  /**
   * Raw message payload.
   */
  readonly payload: unknown;

  /**
   * Raw event source (events only); `undefined` for commands and queries.
   */
  readonly source: Optional<unknown>;

  /**
   * Epoch milliseconds when the message was observed.
   */
  readonly timestamp: number;
}

/**
 * One observed message delta, attributed to the bus-owning container.
 *
 * @remarks
 * Attribution is **bus-scoped**: a message on an inherited bus is attributed to the
 * container that first tapped that bus (typically the root), not the emitting service.
 *
 * @group DevTools
 */
export interface DevtoolsMessageEvent {
  /**
   * Discriminant.
   */
  readonly kind: "message";

  /**
   * Root the message originated from.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Container the tapped bus is attributed to.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * The observed message.
   */
  readonly message: DevtoolsMessage;
}

/**
 * The settled outcome of a command/query dispatch, reported by the bus tap.
 *
 * @group DevTools
 */
export interface DevtoolsMessageResult {
  /**
   * Id of the {@link DevtoolsMessage} this result belongs to.
   */
  readonly messageId: number;

  /**
   * Whether the dispatch resolved or rejected/threw.
   */
  readonly outcome: "resolved" | "rejected";

  /**
   * Raw resolved value or thrown error — serialized by the backend when bridging.
   */
  readonly value: unknown;
}

/**
 * A command/query **result** delta, correlated to its dispatch by `messageId` (bus-scoped, like
 * {@link DevtoolsMessageEvent}). Events do not produce results.
 *
 * @group DevTools
 */
export interface DevtoolsMessageResultEvent extends DevtoolsMessageResult {
  /**
   * Discriminant.
   */
  readonly kind: "messageResult";

  /**
   * Root the dispatch originated from.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Container the tapped bus is attributed to.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Epoch milliseconds when the result settled.
   */
  readonly timestamp: number;
}

/**
 * Whether a handler/subscriber was registered or unregistered.
 *
 * @group DevTools
 */
export type DevtoolsRegistrationPhase = "registered" | "unregistered";

/**
 * One observed handler/subscriber registration change.
 *
 * @remarks
 * Captures both decorated handlers (wired at provision) and imperative `bus.register` /
 * `bus.subscribe` registrations. `type` is `"*"` for a catch-all event subscriber.
 *
 * @group DevTools
 */
export interface DevtoolsRegistration {
  /**
   * Channel the handler is on.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Stringified message type the handler covers; `"*"` for a catch-all event subscriber.
   */
  readonly type: string;

  /**
   * Whether the handler was registered or unregistered.
   */
  readonly phase: DevtoolsRegistrationPhase;
}

/**
 * One registration delta, attributed to the bus-owning container (bus-scoped, like
 * {@link DevtoolsMessageEvent}).
 *
 * @group DevTools
 */
export interface DevtoolsRegistrationEvent {
  /**
   * Discriminant.
   */
  readonly kind: "registration";

  /**
   * Root the registration originated from.
   */
  readonly rootId: DevtoolsRootId;

  /**
   * Container the tapped bus is attributed to.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Epoch milliseconds when the delta was emitted.
   */
  readonly timestamp: number;

  /**
   * The observed registration change.
   */
  readonly registration: DevtoolsRegistration;
}

/**
 * One delta emitted to listening backends: a lifecycle change, an observed message, or a
 * handler registration change.
 *
 * @group DevTools
 */
export type DevtoolsEvent =
  | DevtoolsLifecycleEvent
  | DevtoolsMessageEvent
  | DevtoolsMessageResultEvent
  | DevtoolsRegistrationEvent;

/**
 * A path from a service instance to a nested value: object keys and array indices.
 *
 * @group DevTools
 */
export type DevtoolsInspectPath = ReadonlyArray<string | number>;

/**
 * What a plugin hands the hook to register a root: a way to snapshot the root's
 * tree on demand, and (optionally) to read a live value on demand.
 *
 * @group DevTools
 */
export interface DevtoolsRootRegister {
  /**
   * Produces the current snapshot of the root's whole observed subtree.
   */
  snapshot(): DevtoolsRootSnapshot;

  /**
   * Reads the **raw** live value at `path` within the instance identified by `instanceId`, or
   * `undefined` when the instance is not in this root. Read-only; the consumer serializes the
   * result. Absent on a root whose plugin predates on-demand inspection.
   *
   * @param instanceId - Instance to read from.
   * @param path - Object keys / array indices from the instance to the value.
   * @returns The raw value at the path.
   */
  inspect?(instanceId: DevtoolsInstanceId, path: DevtoolsInspectPath): unknown;
}

/**
 * A registered root, as seen by a backend.
 *
 * @group DevTools
 */
export interface DevtoolsRoot extends DevtoolsRootRegister {
  /**
   * The root's id.
   */
  readonly rootId: DevtoolsRootId;
}

/**
 * Backend listener invoked for each lifecycle delta.
 *
 * @group DevTools
 */
export type DevtoolsListener = (event: DevtoolsEvent) => void;
