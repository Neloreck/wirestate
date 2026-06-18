import { type DevtoolsEvent, type DevtoolsHook, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";

import { ensureHook, FALLBACK_PROTOCOL_VERSION } from "@/backend/create-hook";
import { dehydrate } from "@/backend/dehydrate";
import { describeNode, serviceNode } from "@/backend/inspect";
import {
  BRIDGE_SOURCE,
  type BackendToPanel,
  type InspectNode,
  type PageMessage,
  type PanelToBackend,
} from "@/bridge/messages";
import { type Optional } from "@/types/general";

/**
 * Upper bound on buffered events replayed to a late-attaching / reconnecting panel.
 */
const RING_BUFFER_SIZE = 500;

const hook: DevtoolsHook = ensureHook();
const buffer: Array<DevtoolsEvent> = [];

/**
 * Replaces a message delta's raw payload/source with a clone-safe preview; other deltas pass through.
 *
 * @param event - The devtools delta to sanitize.
 * @returns The delta with any message payload and source cloned for safe transfer.
 */
function sanitize(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return {
      ...event,
      message: {
        ...event.message,
        payload: dehydrate(event.message.payload),
        source: dehydrate(event.message.source),
      },
    };
  }

  if (event.kind === "messageResult") {
    return { ...event, value: dehydrate(event.value) };
  }

  return event;
}

/**
 * Ensures every delta exposes a timestamp the panel can show uniformly. Messages already carry
 * `message.timestamp`; lifecycle/registration deltas from an older core may lack one, so stamp the
 * real observe time (the backend subscribes from `document_start`, so this ≈ emit time).
 *
 * @param event - The (already sanitized) delta.
 * @returns The delta, guaranteed to expose a timestamp.
 */
function stampTime(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return event;
  }

  return (event as { timestamp?: number }).timestamp === undefined ? { ...event, timestamp: Date.now() } : event;
}

function record(event: DevtoolsEvent): DevtoolsEvent {
  const safe: DevtoolsEvent = stampTime(sanitize(event));

  buffer.push(safe);
  if (buffer.length > RING_BUFFER_SIZE) {
    buffer.shift();
  }

  return safe;
}

function snapshot(): ReadonlyArray<DevtoolsRootSnapshot> {
  return hook.getRoots().map((root) => root.snapshot());
}

function inspectAt(rootId: number, instanceId: number, path: ReadonlyArray<string | number>): InspectNode {
  const root = hook.getRoots().find((candidate) => candidate.rootId === rootId);

  // A root whose plugin predates on-demand inspection has no `inspect` — report it as unsupported.
  if (!root || typeof root.inspect !== "function") {
    return { t: "unsupported" };
  }

  const value: unknown = root.inspect(instanceId, path);

  // When a nested field holds another tracked instance, mark it as a service so the panel can jump
  // to it. `path.length === 0` is the inspected instance itself — never flag that as a reference.
  if (path.length > 0 && value !== null && typeof value === "object" && typeof root.serviceRefOf === "function") {
    const ref = root.serviceRefOf(value);

    if (ref) {
      return serviceNode(ref);
    }
  }

  return describeNode(value);
}

function post(payload: BackendToPanel): void {
  const message: PageMessage = { source: BRIDGE_SOURCE, dir: "to-content", payload };

  window.postMessage(message, "*");
}

hook.subscribe((event: DevtoolsEvent): void => {
  post({ type: "event", event: record(event) });
});

window.addEventListener("message", (messageEvent: MessageEvent): void => {
  const data: Optional<PageMessage> = messageEvent.data as Optional<PageMessage>;

  if (!data || data.source !== BRIDGE_SOURCE || data.dir !== "to-page") {
    return;
  }

  const request: PanelToBackend = data.payload;

  if (request.type === "attach") {
    post({
      type: "init",
      protocolVersion: hook.protocolVersion ?? FALLBACK_PROTOCOL_VERSION,
      roots: snapshot(),
      events: [...buffer],
    });
  } else if (request.type === "refresh") {
    post({ type: "snapshot", roots: snapshot() });
  } else if (request.type === "inspect") {
    post({
      type: "inspectResult",
      requestId: request.requestId,
      node: inspectAt(request.rootId, request.instanceId, request.path),
    });
  }
});
