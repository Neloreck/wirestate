import {
  DEVTOOLS_PROTOCOL_VERSION,
  type DevtoolsEvent,
  type DevtoolsHook,
  type DevtoolsRoot,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";

import { createDescribeNode, createServiceNode } from "@/backend/backend.node";
import { sanitizeDevtoolsEvent, stampTimeInDevtoolsEvent } from "@/backend/backend.utils";
import {
  BRIDGE_SOURCE,
  type BackendToPanelPayload,
  type InspectNode,
  type PageMessage,
  type PanelToBackendPayload,
} from "@/bridge/bridge.messages";
import { type Maybe, type Optional } from "@/types/general";

/**
 * The in-page inspector backend. Runs in the page's MAIN world: reads the wirestate DevTools hook,
 * forwards its lifecycle/message deltas to the panel (buffering them so a late or reconnecting panel
 * can replay), and answers the panel's snapshot / on-demand-inspection requests.
 *
 * @remarks
 * Owns its mutable state (the replay buffer) and the `hook` + `post` transport it is constructed with,
 * so it can be driven directly in tests with no globals or DOM.
 */
export class InspectorBackend {
  public static readonly BACKEND_BUFFER_SIZE: number = 512;

  /**
   * Recent deltas retained for replay to a late / reconnecting panel (oldest evicted past the cap).
   */
  private readonly buffer: Array<DevtoolsEvent> = [];

  /**
   * @param hook - The page's DevTools hook — the source of roots and the lifecycle/message stream.
   * @param post - Transport that delivers one message to the panel.
   * @param bufferSize - Maximum deltas retained for replay.
   */
  public constructor(
    private readonly hook: DevtoolsHook,
    private readonly post: (payload: BackendToPanelPayload) => void,
    private readonly bufferSize: number = InspectorBackend.BACKEND_BUFFER_SIZE
  ) {}

  /**
   * Handles one delta from the hook: records it in the replay buffer and forwards it to the panel.
   * The hook subscription itself is wired externally (in the content-script entry), so the class
   * carries no subscription side effects.
   *
   * @param event - The delta the hook emitted.
   */
  public onDelta(event: DevtoolsEvent): void {
    this.post({ type: "event", event: this.record(event) });
  }

  /**
   * Handles one page `message`: ignores anything that is not a panel->backend bridge envelope, then
   * dispatches the request it carries. The `window` listener is added externally (in the entry), so
   * this is purely the callback — the class never touches the DOM.
   *
   * @param messageEvent - A `message` event observed on the page.
   */
  public onMessage(messageEvent: MessageEvent): void {
    const data: Optional<PageMessage> = messageEvent.data as Optional<PageMessage>;

    if (!data || data.source !== BRIDGE_SOURCE || data.dir !== "to-page") {
      return;
    }

    this.onMessageRequest(data.payload);
  }

  /**
   * Answers one panel request: `attach` (init payload), `refresh` (re-snapshot), `inspect` (one-level
   * instance read), and `inspectBinding` (one-level `Value` binding read).
   *
   * @param request - The decoded panel-to-backend request.
   */
  public onMessageRequest(request: PanelToBackendPayload): void {
    switch (request.type) {
      case "attach":
        this.post({
          type: "init",
          protocolVersion: this.hook.protocolVersion ?? DEVTOOLS_PROTOCOL_VERSION,
          roots: this.snapshotRoots(),
          events: [...this.buffer],
        });
        break;

      case "refresh":
        this.post({ type: "snapshot", roots: this.snapshotRoots() });
        break;

      case "inspect":
        this.post({
          type: "inspectResult",
          requestId: request.requestId,
          node: this.inspectAt(request.rootId, request.instanceId, request.path),
        });
        break;

      case "inspectBinding":
        this.post({
          type: "inspectResult",
          requestId: request.requestId,
          node: this.inspectBindingAt(request.rootId, request.bindingId, request.path),
        });
        break;
    }
  }

  /**
   * Snapshots every registered root for the panel's tree.
   *
   * @returns A snapshot for each currently registered root.
   */
  public snapshotRoots(): ReadonlyArray<DevtoolsRootSnapshot> {
    return this.hook.getRoots().map((root) => root.snapshot());
  }

  /**
   * Reads the live value at `path` within an instance and returns a clone-safe, one-level node — or a
   * service marker when the value is itself another tracked instance.
   *
   * @param rootId - Root whose `inspect` resolves the value.
   * @param instanceId - Instance to read from.
   * @param path - Object keys / array indices from the instance to the value.
   * @returns The describing node, or `{ t: "unsupported" }` when the root is no longer registered.
   */
  public inspectAt(rootId: number, instanceId: number, path: ReadonlyArray<string | number>): InspectNode {
    const root: Maybe<DevtoolsRoot> = this.findRoot(rootId);

    return root ? this.resolveNode(root, root.inspect(instanceId, path), path) : { t: "unsupported" };
  }

  /**
   * Reads the live value at `path` within a `Value` binding — the binding-side counterpart of
   * {@link inspectAt}.
   *
   * @param rootId - Root whose `inspectBinding` resolves the value.
   * @param bindingId - `Value` binding to read from.
   * @param path - Object keys / array indices from the binding's value to the target.
   * @returns The describing node, or `{ t: "unsupported" }` when the root is no longer registered.
   */
  public inspectBindingAt(rootId: number, bindingId: number, path: ReadonlyArray<string | number>): InspectNode {
    const root: Maybe<DevtoolsRoot> = this.findRoot(rootId);

    return root ? this.resolveNode(root, root.inspectBinding(bindingId, path), path) : { t: "unsupported" };
  }

  /**
   * Sanitizes + timestamps a delta and appends it to the ring buffer, evicting the oldest once the cap
   * is exceeded.
   *
   * @param event - The raw delta the hook emitted.
   * @returns The clone-safe, timestamped delta that was buffered.
   */
  private record(event: DevtoolsEvent): DevtoolsEvent {
    const safe: DevtoolsEvent = stampTimeInDevtoolsEvent(sanitizeDevtoolsEvent(event));

    this.buffer.push(safe);

    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    return safe;
  }

  /**
   * Finds a registered root by id.
   *
   * @param rootId - Root to locate.
   * @returns The root, or `undefined` when none is registered under that id.
   */
  private findRoot(rootId: number): Maybe<DevtoolsRoot> {
    return this.hook.getRoots().find((candidate) => candidate.rootId === rootId);
  }

  /**
   * Maps a raw inspected value to a one-level node: a `service` marker when a nested field is itself a
   * tracked instance (so the panel can jump to it), otherwise a described node. The root value
   * (`path.length === 0`) is never flagged as a reference.
   *
   * @param root - Root the value was read from (used to recognise tracked instances).
   * @param value - The raw value at `path`.
   * @param path - The path the value was read at.
   * @returns The clone-safe, one-level node.
   */
  private resolveNode(root: DevtoolsRoot, value: unknown, path: ReadonlyArray<string | number>): InspectNode {
    if (path.length > 0 && value !== null && typeof value === "object") {
      const ref = root.serviceRefOf(value);

      if (ref) {
        return createServiceNode(ref);
      }
    }

    return createDescribeNode(value);
  }
}
