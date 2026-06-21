import {
  type DevtoolsEvent,
  type DevtoolsRootRegister,
  type DevtoolsServiceRef,
} from "@wirestate/core/devtools";

import {
  mockLifecycleEvent,
  mockLifecycleEventWithoutTimestamp,
  mockMessageEvent,
  mockMessageResultEvent,
  mockRootSnapshot,
} from "@/fixtures/devtools";

import { BACKEND_BUFFER_SIZE } from "@/backend/backend.config";
import { dehydrate } from "@/backend/backend.dehydrate";
import { serviceNode } from "@/backend/backend.inspect";
import { BACKEND_BUFFER, BACKEND_HOOK } from "@/backend/backend.state";
import { getRootsSnapshot, inspectAt, inspectBindingAt, record, sanitize, stampTime } from "@/backend/backend.utils";

function getTimestampOf(event: DevtoolsEvent): unknown {
  return (event as { timestamp?: number }).timestamp;
}

/**
 * Registers a root, defaulting the required capability methods so a test supplies only the parts it
 * exercises. Mirrors how a real `DevToolsPlugin` always provides all three.
 *
 * @param partial - Register fields to override; `snapshot` is required, the rest default to stubs.
 * @returns The allocated root id.
 */
function registerRoot(partial: Partial<DevtoolsRootRegister> & Pick<DevtoolsRootRegister, "snapshot">): number {
  return BACKEND_HOOK.registerRoot({
    inspect: () => undefined,
    inspectBinding: () => undefined,
    serviceRefOf: () => undefined,
    ...partial,
  });
}

afterEach(() => {
  for (const root of BACKEND_HOOK.getRoots()) {
    BACKEND_HOOK.deregisterRoot(root.rootId);
  }

  BACKEND_BUFFER.length = 0;
});

describe("sanitize", () => {
  it("dehydrates a message delta's payload and source", () => {
    const payload = { hello: "world" };
    const source = { from: "svc" };
    const result = sanitize(mockMessageEvent({ message: { payload, source } }));

    expect(result.kind).toBe("message");
    if (result.kind === "message") {
      expect(result.message.payload).toEqual(dehydrate(payload));
      expect(result.message.source).toEqual(dehydrate(source));
    }
  });

  it("dehydrates a messageResult delta's value", () => {
    const value = { big: "object" };
    const result = sanitize(mockMessageResultEvent({ value }));

    if (result.kind === "messageResult") {
      expect(result.value).toEqual(dehydrate(value));
    }
  });

  it("passes other deltas through unchanged (by reference)", () => {
    const event = mockLifecycleEvent({ timestamp: 5 });

    expect(sanitize(event)).toBe(event);
  });
});

describe("stampTime", () => {
  it("leaves message deltas alone (they carry message.timestamp)", () => {
    const event = mockMessageEvent();

    expect(stampTime(event)).toBe(event);
  });

  it("passes a delta that already has a timestamp through unchanged", () => {
    const event = mockLifecycleEvent({ timestamp: 5 });

    expect(stampTime(event)).toBe(event);
  });

  it("stamps a delta that is missing a timestamp", () => {
    const event = mockLifecycleEventWithoutTimestamp();
    const stamped = stampTime(event);

    expect(stamped).not.toBe(event);
    expect(typeof getTimestampOf(stamped)).toBe("number");
  });
});

describe("record", () => {
  it("sanitizes, stamps, and appends the delta to the replay buffer", () => {
    const safe = record(mockLifecycleEventWithoutTimestamp());

    expect(typeof getTimestampOf(safe)).toBe("number");
    expect(BACKEND_BUFFER).toHaveLength(1);
    expect(BACKEND_BUFFER[0]).toBe(safe);
  });

  it("caps the ring buffer at BACKEND_BUFFER_SIZE, evicting the oldest", () => {
    for (let i = 0; i < BACKEND_BUFFER_SIZE + 5; i++) {
      record(mockLifecycleEvent({ timestamp: i }));
    }

    expect(BACKEND_BUFFER).toHaveLength(BACKEND_BUFFER_SIZE);
    // The first five (timestamps 0..4) were evicted, so the oldest survivor is timestamp 5.
    expect(getTimestampOf(BACKEND_BUFFER[0])).toBe(5);
  });
});

describe("inspectAt", () => {
  it("describes the value the root's inspect resolves", () => {
    const rootId = registerRoot({ snapshot: mockRootSnapshot, inspect: () => 42 });

    expect(inspectAt(rootId, 1, ["count"])).toEqual({ t: "primitive", value: 42 });
  });

  it("reports unsupported when the root is unknown", () => {
    expect(inspectAt(9999, 1, ["x"])).toEqual({ t: "unsupported" });
  });

  it("marks a nested field that resolves to another tracked instance as a service", () => {
    const ref: DevtoolsServiceRef = { className: "Dep", containerId: 2, instanceId: 9 };
    const rootId = registerRoot({
      snapshot: mockRootSnapshot,
      inspect: () => ({ dep: "ref" }),
      serviceRefOf: () => ref,
    });

    expect(inspectAt(rootId, 1, ["dep"])).toEqual(serviceNode(ref));
  });

  it("never flags the instance itself (path length 0) as a service", () => {
    const rootId = registerRoot({
      snapshot: mockRootSnapshot,
      inspect: () => ({ dep: "ref" }),
      serviceRefOf: () => ({ className: "Dep", containerId: 2, instanceId: 9 }),
    });

    expect(inspectAt(rootId, 1, [])).toMatchObject({ t: "object" });
  });
});

describe("inspectBindingAt", () => {
  it("describes the value the root's inspectBinding resolves", () => {
    const rootId = registerRoot({ snapshot: mockRootSnapshot, inspectBinding: () => "https://api" });

    expect(inspectBindingAt(rootId, 1, [])).toEqual({ t: "primitive", value: "https://api" });
  });

  it("reports unsupported when the root is unknown", () => {
    expect(inspectBindingAt(9999, 1, [])).toEqual({ t: "unsupported" });
  });

  it("marks a nested field that resolves to a tracked instance as a service", () => {
    const ref: DevtoolsServiceRef = { className: "Dep", containerId: 2, instanceId: 9 };
    const rootId = registerRoot({
      snapshot: mockRootSnapshot,
      inspectBinding: () => ({ dep: "ref" }),
      serviceRefOf: () => ref,
    });

    expect(inspectBindingAt(rootId, 1, ["dep"])).toEqual(serviceNode(ref));
  });

  it("never flags the binding's own value (path length 0) as a service", () => {
    const rootId = registerRoot({
      snapshot: mockRootSnapshot,
      inspectBinding: () => ({ dep: "ref" }),
      serviceRefOf: () => ({ className: "Dep", containerId: 2, instanceId: 9 }),
    });

    expect(inspectBindingAt(rootId, 1, [])).toMatchObject({ t: "object" });
  });
});

describe("getRootsSnapshot", () => {
  it("returns each registered root's snapshot", () => {
    const snapshot = mockRootSnapshot(777);

    registerRoot({ snapshot: () => snapshot });

    expect(getRootsSnapshot()).toEqual([snapshot]);
  });
});
