import {
  DEVTOOLS_HOOK_KEY,
  type DevtoolsHook,
  type DevtoolsRootRegister,
  type DevtoolsServiceRef,
  installDevtoolsHook,
} from "#/devtools";

import { mockContainerSnapshot, mockLifecycleEvent, mockRootSnapshot } from "@/fixtures/devtools";

import { InspectorBackend } from "@/backend/backend.inspector";
import { createServiceInspectNode } from "@/backend/backend.node";
import { BRIDGE_SOURCE, type BackendToPanelPayload } from "@/bridge/bridge.messages";
import type { Optional } from "@/types/general";

interface SetupContext {
  readonly hook: DevtoolsHook;
  readonly posts: Array<BackendToPanelPayload>;
  readonly backend: InspectorBackend;
}

function setup(bufferSize?: number): SetupContext {
  const hook: DevtoolsHook = installDevtoolsHook();
  const posts: Array<BackendToPanelPayload> = [];
  const backend: InspectorBackend = new InspectorBackend(hook, (payload) => posts.push(payload), bufferSize);

  return { hook, posts, backend };
}

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

function mockMessageEvent(data: unknown): MessageEvent {
  return { data } as unknown as MessageEvent;
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
});

describe("InspectorBackend.onDelta", () => {
  it("forwards a delta to the panel, sanitized and timestamped", () => {
    const { posts, backend } = setup();

    backend.onDelta(mockLifecycleEvent({ phase: "activate", className: "ExampleClassName" }));

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ type: "event", event: { kind: "lifecycle", phase: "activate" } });
  });

  it("buffers deltas for replay and evicts the oldest past the cap", () => {
    const { posts, backend } = setup(2);

    backend.onDelta(mockLifecycleEvent({ containerId: 1 }));
    backend.onDelta(mockLifecycleEvent({ containerId: 2 }));
    backend.onDelta(mockLifecycleEvent({ containerId: 3 }));

    // Attach replays the buffer, capped at 2, so the oldest (container 1) was evicted.
    backend.onMessageRequest({ type: "attach" });

    const init: Optional<BackendToPanelPayload> = posts.find((payload) => payload.type === "init");

    expect(init?.type).toBe("init");
    // IF just for type assert.
    if (init?.type === "init") {
      expect(init.events.map((event) => event.containerId)).toEqual([2, 3]);
    }
  });
});

describe("InspectorBackend.onMessage", () => {
  it("dispatches a panel-backend bridge envelope", () => {
    const { posts, backend } = setup();

    backend.onMessage(mockMessageEvent({ source: BRIDGE_SOURCE, dir: "to-page", payload: { type: "refresh" } }));

    expect(posts).toEqual([{ type: "snapshot", roots: [] }]);
  });

  it("ignores anything that is not a panel-backend bridge envelope", () => {
    const { posts, backend } = setup();

    backend.onMessage(mockMessageEvent(undefined));
    backend.onMessage(mockMessageEvent({ source: "other", dir: "to-page", payload: { type: "refresh" } }));
    backend.onMessage(mockMessageEvent({ source: BRIDGE_SOURCE, dir: "to-content", payload: { type: "refresh" } }));

    expect(posts).toEqual([]);
  });
});

describe("InspectorBackend.onMessageRequest", () => {
  it("answers attach with the protocol version, root snapshots, and buffered events", () => {
    const { hook, posts, backend } = setup();

    const snapshot = mockRootSnapshot(1, [mockContainerSnapshot(1)]);

    registerRoot(hook, { snapshot: () => snapshot });
    backend.onMessageRequest({ type: "attach" });

    expect(posts).toEqual([{ type: "init", protocolVersion: hook.protocolVersion, roots: [snapshot], events: [] }]);
  });

  it("answers refresh with a fresh snapshot", () => {
    const { hook, posts, backend } = setup();

    const snapshot = mockRootSnapshot(7, [mockContainerSnapshot(1)]);

    registerRoot(hook, { snapshot: () => snapshot });
    backend.onMessageRequest({ type: "refresh" });

    expect(posts).toEqual([{ type: "snapshot", roots: [snapshot] }]);
  });

  it("omits roots that currently have no containers", () => {
    const { hook, posts, backend } = setup();

    const populated = mockRootSnapshot(1, [mockContainerSnapshot(1)]);
    const empty = mockRootSnapshot(2, []);

    // A root registered on `install` before its first container provisions (or an HMR-orphaned one mid-teardown).
    registerRoot(hook, { snapshot: () => populated });
    registerRoot(hook, { snapshot: () => empty });

    backend.onMessageRequest({ type: "refresh" });

    expect(posts).toEqual([{ type: "snapshot", roots: [populated] }]);
  });

  it("answers inspect with the described node, correlated by requestId", () => {
    const { hook, posts, backend } = setup();

    const rootId = registerRoot(hook, { snapshot: mockRootSnapshot, inspect: () => 42 });

    backend.onMessageRequest({ type: "inspect", requestId: 5, rootId, instanceId: 1, path: ["count"] });

    expect(posts).toEqual([{ type: "inspectResult", requestId: 5, node: { kind: "primitive", value: 42 } }]);
  });

  it("answers inspectBinding with the described node, correlated by requestId", () => {
    const { hook, posts, backend } = setup();

    const rootId = registerRoot(hook, { snapshot: mockRootSnapshot, inspectBinding: () => "https://api" });

    backend.onMessageRequest({ type: "inspectBinding", requestId: 6, rootId, bindingId: 1, path: [] });

    expect(posts).toEqual([{ type: "inspectResult", requestId: 6, node: { kind: "primitive", value: "https://api" } }]);
  });
});

describe("InspectorBackend inspection", () => {
  it("returns unsupported for an unknown root", () => {
    const { backend } = setup();

    expect(backend.inspectAt(9999, 1, [])).toEqual({ kind: "unsupported" });
    expect(backend.inspectBindingAt(9999, 1, [])).toEqual({ kind: "unsupported" });
  });

  it("marks a nested field that resolves to a tracked instance as a service", () => {
    const { hook, backend } = setup();

    const ref: DevtoolsServiceRef = { className: "SampleRefClass", containerId: 2, instanceId: 9 };
    const rootId = registerRoot(hook, {
      snapshot: mockRootSnapshot,
      inspect: () => ({ sampleRef: "ref" }),
      serviceRefOf: () => ref,
    });

    expect(backend.inspectAt(rootId, 1, ["sampleRef"])).toEqual(createServiceInspectNode(ref));
  });

  it("never flags the root value (path length 0) as a service", () => {
    const { hook, backend } = setup();

    const rootId = registerRoot(hook, {
      snapshot: mockRootSnapshot,
      inspect: () => ({ dep: "ref" }),
      serviceRefOf: () => ({ className: "SampleRefClass", containerId: 2, instanceId: 9 }),
    });

    expect(backend.inspectAt(rootId, 1, [])).toMatchObject({ kind: "object" });
  });
});
