import { type BindingScopeValue, type BindingTypeValue } from "../../binding/binding";
import { type Nullable, type Optional } from "../../types/general";

/**
 * Identifier for a registered root (one installed {@link DevToolsPlugin}).
 *
 * @group DevTools
 */
export type DevtoolsRootId = number;

/**
 * Identifier for a container, stable for its lifetime and shared across roots that observe it.
 *
 * @group DevTools
 */
export type DevtoolsContainerId = number;

/**
 * Identifier for a service instance, stable for its lifetime and unique across containers.
 *
 * @group DevTools
 */
export type DevtoolsInstanceId = number;

/**
 * Identifier for a binding, stable for its lifetime (keyed on the descriptor's identity).
 *
 * @group DevTools
 */
export type DevtoolsBindingId = number;

/**
 * Display-ready description of a binding token.
 *
 * @group DevTools
 */
export interface DevtoolsToken {
  /**
   * Token label (class name, symbol description, or token string).
   */
  readonly name: string;

  /**
   * Token category, for icon or grouping in the panel.
   */
  readonly kind: "class" | "string" | "symbol" | "injectionToken";
}

/**
 * Description of one binding registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsBinding {
  /**
   * Stable id for this binding.
   */
  readonly bindingId: DevtoolsBindingId;

  /**
   * Token the binding is registered under.
   */
  readonly token: DevtoolsToken;

  /**
   * Construction strategy.
   */
  readonly type: BindingTypeValue;

  /**
   * Lifetime scope.
   */
  readonly scope: BindingScopeValue;

  /**
   * Implementation class name for instance bindings, otherwise `undefined`.
   */
  readonly implementation: Optional<string>;
}

/**
 * Snapshot of a service instance's lifecycle status.
 *
 * @group DevTools
 */
export interface DevtoolsInstanceStatus {
  /**
   * Whether the instance was deactivated and removed from its container.
   */
  readonly isDeactivated: boolean;

  /**
   * Provider ownership: `null` not yet provisioned, `false` owned, `true` deprovisioned.
   */
  readonly isDeprovisioned: Nullable<boolean>;

  /**
   * Whether the instance's lifecycle has ended.
   */
  readonly isInactive: boolean;

  /**
   * Current provision-cycle id, or `null` outside a cycle.
   */
  readonly provisionId: Nullable<number>;
}

/**
 * A message handler a service declares via `@OnEvent` / `@OnCommand` / `@OnQuery`.
 *
 * @group DevTools
 */
export interface DevtoolsHandler {
  /**
   * Channel the handler is on.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Message type the handler covers, or `"*"` for a catch-all event handler.
   */
  readonly type: string;

  /**
   * Handler method name on the service.
   */
  readonly method: string;
}

/**
 * A method declared on a service instance's class or a base class.
 *
 * @remarks
 * Accessors, statics, the constructor, and arrow-function fields are excluded.
 *
 * @group DevTools
 */
export interface DevtoolsMethod {
  /**
   * Method name.
   */
  readonly name: string;

  /**
   * Declared parameter count.
   */
  readonly arity: number;
}

/**
 * One of the four single-method lifecycle hooks a service may declare.
 *
 * @group DevTools
 */
export type DevtoolsLifecycleHook = "onActivation" | "onDeactivation" | "onProvision" | "onDeprovision";

/**
 * A lifecycle hook a service declares, paired with its implementing method.
 *
 * @group DevTools
 */
export interface DevtoolsLifecycleHookMethod {
  /**
   * Which lifecycle hook the method is wired to.
   */
  readonly hook: DevtoolsLifecycleHook;

  /**
   * Implementing method name (symbols stringified).
   */
  readonly method: string;
}

/**
 * Description of one active service instance.
 *
 * @group DevTools
 */
export interface DevtoolsInstance {
  /**
   * Stable id for this instance.
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
   * Decorated message handlers this instance declares.
   */
  readonly handlers: ReadonlyArray<DevtoolsHandler>;

  /**
   * Methods declared on the instance's class and base classes.
   */
  readonly methods: ReadonlyArray<DevtoolsMethod>;

  /**
   * Lifecycle hooks this instance declares, in setup-to-teardown order.
   */
  readonly lifecycle: ReadonlyArray<DevtoolsLifecycleHookMethod>;
}

/**
 * Description of one plugin registered on a container.
 *
 * @group DevTools
 */
export interface DevtoolsPluginInfo {
  /**
   * Plugin class name.
   */
  readonly name: string;

  /**
   * Messaging-handler kinds the plugin owns, empty for pure observers.
   */
  readonly handles: ReadonlyArray<string>;
}

/**
 * Snapshot of one container.
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
   * Bindings registered on this container, in registration order.
   */
  readonly bindings: ReadonlyArray<DevtoolsBinding>;

  /**
   * Active instances this container constructed, in creation order.
   */
  readonly instances: ReadonlyArray<DevtoolsInstance>;

  /**
   * Plugins registered directly on this container.
   */
  readonly plugins: ReadonlyArray<DevtoolsPluginInfo>;
}

/**
 * Snapshot of one root and every container observed under it.
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
   * Every container under this root, root container first.
   */
  readonly containers: ReadonlyArray<DevtoolsContainerSnapshot>;

  /**
   * Human label set via `new DevToolsPlugin({ label })`, or `undefined`.
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
 * A container or instance lifecycle delta.
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
 * Channel a {@link DevtoolsMessage} flowed through.
 *
 * @group DevTools
 */
export type DevtoolsMessageChannel = "event" | "command" | "query";

/**
 * One observed message: an event emitted, or a command/query dispatched.
 *
 * @remarks
 * `payload` and `source` are raw in-page values, serialized by the backend when bridging.
 *
 * @group DevTools
 */
export interface DevtoolsMessage {
  /**
   * Correlation id, unique per dispatch. A {@link DevtoolsMessageResultEvent} references it via `messageId`.
   */
  readonly id: number;

  /**
   * Which bus the message flowed through.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Message type (event, command, or query type).
   */
  readonly type: string;

  /**
   * Raw message payload.
   */
  readonly payload: unknown;

  /**
   * Raw event source, or `undefined` for commands and queries.
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
 * A message on an inherited bus is attributed to the container that first tapped it, not the emitter.
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
 * The settled outcome of a command/query dispatch.
 *
 * @group DevTools
 */
export interface DevtoolsMessageResult {
  /**
   * Id of the {@link DevtoolsMessage} this result belongs to.
   */
  readonly messageId: number;

  /**
   * Whether the dispatch resolved or rejected.
   */
  readonly outcome: "resolved" | "rejected";

  /**
   * Raw resolved value or thrown error.
   */
  readonly value: unknown;
}

/**
 * A command/query result delta, correlated to its dispatch by `messageId`. Events produce none.
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
 * Whether a handler was registered or unregistered.
 *
 * @group DevTools
 */
export type DevtoolsRegistrationPhase = "registered" | "unregistered";

/**
 * One observed handler registration change (decorated or imperative).
 *
 * @group DevTools
 */
export interface DevtoolsRegistration {
  /**
   * Channel the handler is on.
   */
  readonly channel: DevtoolsMessageChannel;

  /**
   * Message type the handler covers, or `"*"` for a catch-all event subscriber.
   */
  readonly type: string;

  /**
   * Whether the handler was registered or unregistered.
   */
  readonly phase: DevtoolsRegistrationPhase;
}

/**
 * One registration delta, attributed to the bus-owning container.
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
 * One delta emitted to backends: a lifecycle change, a message, a result, or a registration change.
 *
 * @group DevTools
 */
export type DevtoolsEvent =
  | DevtoolsLifecycleEvent
  | DevtoolsMessageEvent
  | DevtoolsMessageResultEvent
  | DevtoolsRegistrationEvent;

/**
 * A path from an inspection root to a nested value: object keys and array indices.
 *
 * @group DevTools
 */
export type DevtoolsInspectPath = ReadonlyArray<string | number>;

/**
 * A reference to a tracked instance, returned when an inspected field is another managed instance.
 *
 * @group DevTools
 */
export interface DevtoolsServiceRef {
  /**
   * Stable id of the referenced instance.
   */
  readonly instanceId: DevtoolsInstanceId;

  /**
   * Id of the container that owns the referenced instance.
   */
  readonly containerId: DevtoolsContainerId;

  /**
   * Concrete class name of the referenced instance.
   */
  readonly className: string;
}

/**
 * What a plugin hands the hook to register a root: snapshot the tree and read live values on demand.
 *
 * @group DevTools
 */
export interface DevtoolsRootRegister {
  /**
   * Produces the current snapshot of the root's observed subtree.
   *
   * @returns The root snapshot.
   */
  snapshot(): DevtoolsRootSnapshot;

  /**
   * Reads the raw live value at `path` within an instance, or `undefined` when it is not in this root.
   *
   * @param instanceId - Instance to read from.
   * @param path - Object keys or array indices to the value.
   * @returns The raw value at the path.
   */
  inspect(instanceId: DevtoolsInstanceId, path: DevtoolsInspectPath): unknown;

  /**
   * Reads the raw live value at `path` within a `Value` binding.
   *
   * @param bindingId - Binding to read from.
   * @param path - Object keys or array indices to the value.
   * @returns The raw value at the path.
   */
  inspectBinding(bindingId: DevtoolsBindingId, path: DevtoolsInspectPath): unknown;

  /**
   * Returns a reference if `value` is a service instance this root tracks, otherwise `undefined`.
   *
   * @param value - The raw value at an inspected field.
   * @returns A service reference, or `undefined`.
   */
  serviceRefOf(value: object): Optional<DevtoolsServiceRef>;
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
 * Backend listener invoked for each delta.
 *
 * @group DevTools
 */
export type DevtoolsListener = (event: DevtoolsEvent) => void;

/**
 * The in-page meeting point between installed {@link DevToolsPlugin}s and an inspector backend.
 *
 * @remarks
 * Created lazily on `globalThis` by the first plugin and shared by every later one, including copies
 * from other library versions on the page. Plugins register roots and emit deltas. A backend
 * snapshots current roots on attach, then subscribes for deltas.
 *
 * @group DevTools
 */
export interface DevtoolsHook {
  /**
   * Protocol version this hook speaks.
   */
  readonly protocolVersion: number;

  /**
   * Registers a root and returns its allocated id.
   *
   * @param register - How to snapshot the root's tree.
   * @returns The new root's id.
   */
  registerRoot(register: DevtoolsRootRegister): DevtoolsRootId;

  /**
   * Removes a root registration.
   *
   * @param rootId - Root to remove.
   */
  deregisterRoot(rootId: DevtoolsRootId): void;

  /**
   * Allocates or returns the stable id for a container.
   *
   * @param container - Container to identify, keyed by object identity.
   * @returns The container's stable id.
   */
  idForContainer(container: object): DevtoolsContainerId;

  /**
   * Allocates or returns the stable id for a service instance.
   *
   * @param instance - Instance to identify, keyed by object identity.
   * @returns The instance's stable id.
   */
  idForInstance(instance: object): DevtoolsInstanceId;

  /**
   * Allocates or returns the stable id for a binding.
   *
   * @param descriptor - Binding descriptor to identify, keyed by object identity.
   * @returns The binding's stable id.
   */
  idForBinding(descriptor: object): DevtoolsBindingId;

  /**
   * Emits a delta to all subscribed backends.
   *
   * @param event - The delta to broadcast.
   */
  emit(event: DevtoolsEvent): void;

  /**
   * Subscribes a backend listener.
   *
   * @param listener - Invoked for each emitted event.
   * @returns A function that removes the listener.
   */
  subscribe(listener: DevtoolsListener): () => void;

  /**
   * Returns the currently registered roots, so a late backend can snapshot before subscribing.
   *
   * @returns The registered roots.
   */
  getRoots(): ReadonlyArray<DevtoolsRoot>;
}
