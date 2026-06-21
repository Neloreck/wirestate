import {
  DEVTOOLS_HOOK_KEY,
  type DevtoolsHook,
  type DevtoolsRootRegister,
  type DevtoolsServiceRef,
  installDevtoolsHook,
} from "@wirestate/core/devtools";

import { mockLifecycleEvent, mockRootSnapshot } from "@/fixtures/devtools";

import { InspectorBackend } from "@/backend/backend.inspector";
import { createServiceNode } from "@/backend/backend.node";
import { BRIDGE_SOURCE, type BackendToPanelPayload } from "@/bridge/bridge.messages";

interface Harness {
  readonly hook: DevtoolsHook;
  readonly posts: Array<BackendToPanelPayload>;
  readonly backend: InspectorBackend;
}

/**
 * Builds a backend over a fresh hook with a capturing transport — no globals or DOM needed.
 *
 * @param bufferSize
 */
function setup(bufferSize?: number): Harness {
  const hook: DevtoolsHook = installDevtoolsHook();
  const posts: Array<BackendToPanelPayload> = [];
  const backend: InspectorBackend = new InspectorBackend(hook, (payload) => posts.push(payload), bufferSize);

  return { hook, posts, backend };
}

/**
 * Registers a root, defaulting the required capability methods so a test supplies only what it uses.
 *
 * @param hook
 * @param partial
 */
function registerRoot(
  hook: DevtoolsHook,
  partial: Partial<DevtoolsRootRegister> & Pick<DevtoolsRootRegister, "snapshot">
): number {
  return hook.registerRoot({
    inspect: () => undefined,
    inspectBinding: () => undefined,
    serviceRefOf: () => undefined,
    ...partial,
  });
}

/**
 * Wraps arbitrary `data` as a page `message` event for the message handler.
 *
 * @param data
 */
const messageEvent = (data: unknown): MessageEvent => ({ data }) as unknown as MessageEvent;

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
});

describe("InspectorBackend.handleRequest", () => {
  it("answers attach with the protocol version, root snapshots, and buffered events", () => {
    const { hook, posts, backend } = setup();
    const snapshot = mockRootSnapshot(1);

    registerRoot(hook, { snapshot: () => snapshot });
    backend.handleRequest({ type: "attach" });

    expect(posts).toEqual([{ type: "init", protocolVersion: hook.protocolVersion, roots: [snapshot], events: [] }]);
  });

  it("answers refresh with a fresh snapshot", () => {
    const { hook, posts, backend } = setup();
    const snapshot = mockRootSnapshot(7);

    registerRoot(hook, { snapshot: () => snapshot });
    backend.handleRequest({ type: "refresh" });

    expect(posts).toEqual([{ type: "snapshot", roots: [snapshot] }]);
  });

  it("answers inspect with the described node, correlated by requestId", () => {
    const { hook, posts, backend } = setup();
    const rootId = registerRoot(hook, { snapshot: mockRootSnapshot, inspect: () => 42 });

    backend.handleRequest({ type: "inspect", requestId: 5, rootId, instanceId: 1, path: ["count"] });

    expect(posts).toEqual([{ type: "inspectResult", requestId: 5, node: { t: "primitive", value: 42 } }]);
  });

  it("answers inspectBinding with the described node, correlated by requestId", () => {
    const { hook, posts, backend } = setup();
    const rootId = registerRoot(hook, { snapshot: mockRootSnapshot, inspectBinding: () => "https://api" });

    backend.handleRequest({ type: "inspectBinding", requestId: 6, rootId, bindingId: 1, path: [] });

    expect(posts).toEqual([{ type: "inspectResult", requestId: 6, node: { t: "primitive", value: "https://api" } }]);
  });
});

describe("InspectorBackend.onDelta", () => {
  it("forwards a delta to the panel, sanitized and timestamped", () => {
    const { posts, backend } = setup();

    backend.onDelta(mockLifecycleEvent({ phase: "activate", className: "Svc" }));

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ type: "event", event: { kind: "lifecycle", phase: "activate" } });
  });

  it("buffers deltas for replay and evicts the oldest past the cap", () => {
    const { posts, backend } = setup(2);

    backend.onDelta(mockLifecycleEvent({ containerId: 1 }));
    backend.onDelta(mockLifecycleEvent({ containerId: 2 }));
    backend.onDelta(mockLifecycleEvent({ containerId: 3 }));

    // Attach replays the buffer; capped at 2, so the oldest (container 1) was evicted.
    backend.handleRequest({ type: "attach" });

    const init: BackendToPanelPayload | undefined = posts.find((payload) => payload.type === "init");

    expect(init?.type).toBe("init");
    if (init?.type === "init") {
      expect(init.events.map((event) => event.containerId)).toEqual([2, 3]);
    }
  });
});

describe("InspectorBackend.onMessage", () => {
  it("dispatches a panel→backend bridge envelope", () => {
    const { posts, backend } = setup();

    backend.onMessage(messageEvent({ source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } }));

    expect(posts).toEqual([{ type: "snapshot", roots: [] }]);
  });

  it("ignores anything that is not a panel→backend bridge envelope", () => {
    const { posts, backend } = setup();

    backend.onMessage(messageEvent(undefined));
    backend.onMessage(messageEvent({ source: "other", dir: "to-page", payload: { type: "refresh" } }));
    backend.onMessage(messageEvent({ source: BRIDGE_SOURCE, dir: "to-content", payload: { type: "refresh" } }));

    expect(posts).toEqual([]);
  });
});

describe("InspectorBackend inspection", () => {
  it("returns unsupported for an unknown root", () => {
    const { backend } = setup();

    expect(backend.inspectAt(9999, 1, [])).toEqual({ t: "unsupported" });
    expect(backend.inspectBindingAt(9999, 1, [])).toEqual({ t: "unsupported" });
  });

  it("marks a nested field that resolves to a tracked instance as a service", () => {
    const { hook, backend } = setup();
    const ref: DevtoolsServiceRef = { className: "Dep", containerId: 2, instanceId: 9 };
    const rootId = registerRoot(hook, {
      snapshot: mockRootSnapshot,
      inspect: () => ({ dep: "ref" }),
      serviceRefOf: () => ref,
    });

    expect(backend.inspectAt(rootId, 1, ["dep"])).toEqual(createServiceNode(ref));
  });

  it("never flags the root value (path length 0) as a service", () => {
    const { hook, backend } = setup();
    const rootId = registerRoot(hook, {
      snapshot: mockRootSnapshot,
      inspect: () => ({ dep: "ref" }),
      serviceRefOf: () => ({ className: "Dep", containerId: 2, instanceId: 9 }),
    });

    expect(backend.inspectAt(rootId, 1, [])).toMatchObject({ t: "object" });
  });
});
