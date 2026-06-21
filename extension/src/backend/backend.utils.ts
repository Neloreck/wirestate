import { type DevtoolsEvent, type DevtoolsRoot, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";

import { BACKEND_BUFFER_SIZE } from "@/backend/backend.config";
import { dehydrate } from "@/backend/backend.dehydrate";
import { describeNode, serviceNode } from "@/backend/backend.inspect";
import { BACKEND_BUFFER, BACKEND_HOOK } from "@/backend/backend.state";
import { type InspectNode } from "@/bridge/bridge.messages";
import { type Maybe } from "@/types/general";

export function getRootsSnapshot(): ReadonlyArray<DevtoolsRootSnapshot> {
  return BACKEND_HOOK.getRoots().map((root) => root.snapshot());
}

/**
 * Replaces a message delta's raw payload/source with a clone-safe preview; other deltas pass through.
 *
 * @param event - The devtools delta to sanitize.
 * @returns The delta with any message payload and source cloned for safe transfer.
 */
export function sanitize(event: DevtoolsEvent): DevtoolsEvent {
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
export function stampTime(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return event;
  }

  return (event as { timestamp?: number }).timestamp === undefined ? { ...event, timestamp: Date.now() } : event;
}

/**
 * Sanitizes and timestamps a delta, then appends it to the ring buffer (evicting the oldest once the
 * cap is exceeded) so a late-attaching panel can replay it.
 *
 * @param event - The raw delta the hook emitted.
 * @returns The clone-safe, timestamped delta that was buffered.
 */
export function record(event: DevtoolsEvent): DevtoolsEvent {
  const safe: DevtoolsEvent = stampTime(sanitize(event));

  BACKEND_BUFFER.push(safe);

  if (BACKEND_BUFFER.length > BACKEND_BUFFER_SIZE) {
    BACKEND_BUFFER.shift();
  }

  return safe;
}

/**
 * Reads the live value at `path` within an instance and returns a clone-safe, one-level node — or a
 * service marker when the value is itself another tracked instance.
 *
 * @param rootId - Root whose `inspect` resolves the value.
 * @param instanceId - Instance to read from.
 * @param path - Object keys / array indices from the instance to the value.
 * @returns The describing node, or `{ t: "unsupported" }` when the root predates on-demand inspection.
 */
export function inspectAt(rootId: number, instanceId: number, path: ReadonlyArray<string | number>): InspectNode {
  const root: Maybe<DevtoolsRoot> = BACKEND_HOOK.getRoots().find((candidate) => candidate.rootId === rootId);

  if (!root) {
    return { t: "unsupported" };
  }

  const value: unknown = root.inspect(instanceId, path);

  // When a nested field holds another tracked instance, mark it as a service so the panel can jump
  // to it. `path.length === 0` is the inspected instance itself — never flag that as a reference.
  if (path.length > 0 && value !== null && typeof value === "object") {
    const ref = root.serviceRefOf(value);

    if (ref) {
      return serviceNode(ref);
    }
  }

  return describeNode(value);
}

/**
 * Reads the live value at `path` within a `Value` binding and returns a clone-safe, one-level node —
 * or a service marker when a nested field is itself another tracked instance. The binding-side
 * counterpart of {@link inspectAt}.
 *
 * @param rootId - Root whose `inspectBinding` resolves the value.
 * @param bindingId - `Value` binding to read from.
 * @param path - Object keys / array indices from the binding's value to the target.
 * @returns The describing node, or `{ t: "unsupported" }` when the root is no longer registered.
 */
export function inspectBindingAt(rootId: number, bindingId: number, path: ReadonlyArray<string | number>): InspectNode {
  const root: Maybe<DevtoolsRoot> = BACKEND_HOOK.getRoots().find((candidate) => candidate.rootId === rootId);

  if (!root) {
    return { t: "unsupported" };
  }

  const value: unknown = root.inspectBinding(bindingId, path);

  // A nested field holding a tracked service becomes a jump, exactly as for instance state. The root
  // (`path.length === 0`) is the binding's own value, rendered inline rather than as a reference.
  if (path.length > 0 && value !== null && typeof value === "object") {
    const ref = root.serviceRefOf(value);

    if (ref) {
      return serviceNode(ref);
    }
  }

  return describeNode(value);
}
