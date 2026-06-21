import { type DevtoolsBinding, type DevtoolsEvent } from "@wirestate/core/devtools";

import {
  mockBinding,
  mockContainerSnapshot,
  mockInstance,
  mockLifecycleEvent,
  mockMessageEvent,
  mockMessageResultEvent,
  mockPluginInfo,
  mockRegistrationEvent,
  mockRootSnapshot,
} from "@/fixtures/devtools";

import {
  bindingStatus,
  buildMessageResults,
  buildRoots,
  channelOf,
  childContainers,
  filterLog,
  lifecycleHistory,
  mayRealizeInstance,
  realizingInstance,
  resolveSelection,
  rootIdOfContainer,
  tokenOfInstanceId,
} from "@/panel/lib/selectors";
import { type TimelineFilter, isSameSelection } from "@/panel/lib/types";

const filterWith = (partial: Partial<TimelineFilter> = {}): TimelineFilter => ({
  rootId: undefined,
  containerId: undefined,
  kinds: { lifecycle: true, message: true, registration: true },
  channels: { event: true, command: true, query: true },
  text: "",
  ...partial,
});

describe("buildRoots", () => {
  it("nests containers by parentContainerId and treats orphans as top-level", () => {
    const roots = [
      mockRootSnapshot(1, [
        mockContainerSnapshot(1, null),
        mockContainerSnapshot(2, 1),
        mockContainerSnapshot(3, 1),
        mockContainerSnapshot(4, 99),
      ]),
    ];
    const built = buildRoots(roots);

    expect(built).toHaveLength(1);
    expect(built[0].nodes.map((node) => node.container.containerId).sort()).toEqual([1, 4]);

    const c1 = built[0].nodes.find((node) => node.container.containerId === 1);

    expect(c1?.children.map((child) => child.container.containerId).sort()).toEqual([2, 3]);
  });

  it("derives a label with id and container count", () => {
    const built = buildRoots([mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1)])]);

    expect(built[0].label).toContain("#1");
    expect(built[0].label).toContain("2 containers");
  });

  it("prefers a configured root label over the derived hint", () => {
    expect(buildRoots([mockRootSnapshot(1, [mockContainerSnapshot(1, null)], "My App")])[0].label).toBe("My App");
  });
});

describe("resolveSelection", () => {
  const roots = [
    mockRootSnapshot(1, [
      mockContainerSnapshot(1, null, {
        instances: [mockInstance("Foo")],
        bindings: [mockBinding("Bar")],
        plugins: [mockPluginInfo("Baz")],
      }),
    ]),
  ];

  it("resolves a live entity", () => {
    expect(resolveSelection(roots, { kind: "container", containerId: 1 })?.kind).toBe("container");
    expect(resolveSelection(roots, { kind: "binding", containerId: 1, token: "Bar" })?.kind).toBe("binding");
    expect(resolveSelection(roots, { kind: "plugin", containerId: 1, name: "Baz" })?.kind).toBe("plugin");
  });

  it("returns undefined when the entity is gone (tombstone trigger)", () => {
    expect(resolveSelection(roots, { kind: "container", containerId: 999 })).toBeUndefined();
    expect(resolveSelection(roots, { kind: "binding", containerId: 1, token: "Gone" })).toBeUndefined();
  });
});

describe("derived links", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1), mockContainerSnapshot(3, 1)]),
  ];

  it("childContainers finds children by parent", () => {
    expect(
      childContainers(roots, 1)
        .map((child) => child.containerId)
        .sort()
    ).toEqual([2, 3]);
    expect(childContainers(roots, 2)).toHaveLength(0);
  });

  it("realizingInstance matches by token name or implementation class", () => {
    const c = mockContainerSnapshot(1, null, { instances: [mockInstance("SvcImpl", "Svc")] });

    expect(realizingInstance(c, mockBinding("Svc"))?.className).toBe("SvcImpl");
    expect(realizingInstance(c, mockBinding("Other", "SvcImpl"))?.className).toBe("SvcImpl");
    expect(realizingInstance(c, mockBinding("None", "Nope"))).toBeUndefined();
  });

  it("mayRealizeInstance is true only for singleton instance bindings", () => {
    const make = (type: DevtoolsBinding["type"], scope: DevtoolsBinding["scope"]): DevtoolsBinding => ({
      bindingId: 1,
      token: { name: "Svc", kind: "class" },
      type,
      scope,
      implementation: undefined,
    });

    expect(mayRealizeInstance(make("Instance", "Singleton"))).toBe(true);
    expect(mayRealizeInstance(make("Instance", "Transient"))).toBe(false);
    expect(mayRealizeInstance(make("Factory", "Singleton"))).toBe(false);
    expect(mayRealizeInstance(make("Value", "Singleton"))).toBe(false);
  });
});

describe("bindingStatus", () => {
  const value: DevtoolsBinding = {
    bindingId: 1,
    token: { name: "cfg", kind: "string" },
    type: "Value",
    scope: "Singleton",
    implementation: undefined,
  };
  const singleton = mockBinding("Svc"); // mockBinding builds an Instance/Singleton binding

  it("is 'none' for a non-instance binding (Value/Factory/Transient)", () => {
    expect(bindingStatus(mockContainerSnapshot(1), value)).toBe("none");
  });

  it("is 'unrealized' for a singleton instance binding with no live instance", () => {
    expect(bindingStatus(mockContainerSnapshot(1, null, { instances: [] }), singleton)).toBe("unrealized");
  });

  it("is 'active' when the realizing instance is live", () => {
    const container = mockContainerSnapshot(1, null, { instances: [mockInstance("Svc")] });

    expect(bindingStatus(container, singleton)).toBe("active");
  });

  it("is 'inactive' when the realizing instance is inactive", () => {
    const inactive = {
      ...mockInstance("Svc"),
      status: { isDeactivated: true, isDeprovisioned: true, isInactive: true, provisionId: null },
    };
    const container = mockContainerSnapshot(1, null, { instances: [inactive] });

    expect(bindingStatus(container, singleton)).toBe("inactive");
  });
});

describe("tokenOfInstanceId", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null, { instances: [mockInstance("SvcImpl", "Svc", 7)] })]),
  ];

  it("maps an instance id to its realizing binding's token", () => {
    expect(tokenOfInstanceId(roots, 1, 7)).toBe("Svc");
  });

  it("is undefined for an unknown instance or container", () => {
    expect(tokenOfInstanceId(roots, 1, 999)).toBeUndefined();
    expect(tokenOfInstanceId(roots, 999, 7)).toBeUndefined();
  });
});

describe("channelOf", () => {
  it("reads the channel for message/registration and undefined for lifecycle", () => {
    expect(channelOf(mockMessageEvent({ containerId: 1, message: { channel: "command", type: "X" } }))).toBe("command");
    expect(channelOf(mockRegistrationEvent({ containerId: 1, registration: { channel: "event", type: "Y" } }))).toBe(
      "event"
    );
    expect(channelOf(mockLifecycleEvent({ containerId: 1, phase: "activate" }))).toBeUndefined();
  });
});

describe("lifecycleHistory", () => {
  const log = [
    mockLifecycleEvent({ containerId: 1, phase: "activate", className: "Foo" }),
    mockLifecycleEvent({ containerId: 1, phase: "provision", className: "Foo" }),
    mockLifecycleEvent({ containerId: 2, phase: "activate", className: "Bar" }),
    mockMessageEvent({ containerId: 1, message: { channel: "event", type: "ping" } }),
  ];

  it("filters by container, and optionally by instance (className fallback)", () => {
    expect(lifecycleHistory(log, 1)).toHaveLength(2);
    expect(lifecycleHistory(log, 1, { className: "Foo" })).toHaveLength(2);
    expect(lifecycleHistory(log, 1, { className: "Other" })).toHaveLength(0);
  });

  it("narrows by instanceId when the target carries one", () => {
    const discriminated: ReadonlyArray<DevtoolsEvent> = [
      mockLifecycleEvent({ instance: mockInstance("Foo", "Foo", 1) }),
      mockLifecycleEvent({ phase: "provision", instance: mockInstance("Foo", "Foo", 2) }),
    ];

    expect(lifecycleHistory(discriminated, 1, { instanceId: 1, className: "Foo" })).toHaveLength(1);
    expect(lifecycleHistory(discriminated, 1, { instanceId: 2, className: "Foo" })).toHaveLength(1);
    expect(lifecycleHistory(discriminated, 1, { className: "Foo" })).toHaveLength(2);
  });
});

describe("filterLog", () => {
  const log = [
    mockLifecycleEvent({ containerId: 1, phase: "activate" }),
    mockMessageEvent({ containerId: 1, message: { channel: "command", type: "X" } }),
    mockRegistrationEvent({ rootId: 2, containerId: 2, registration: { channel: "event", type: "Y" } }),
  ];

  it("passes everything by default", () => {
    expect(filterLog(log, filterWith())).toHaveLength(3);
  });

  it("filters by kind, root, container, channel, and text", () => {
    expect(
      filterLog(log, filterWith({ kinds: { lifecycle: false, message: true, registration: false } }))
    ).toHaveLength(1);
    expect(filterLog(log, filterWith({ rootId: 1 }))).toHaveLength(2);
    expect(filterLog(log, filterWith({ containerId: 1 }))).toHaveLength(2);
    expect(filterLog(log, filterWith({ channels: { event: true, command: false, query: true } }))).toHaveLength(2);
    expect(filterLog(log, filterWith({ text: "X" }))).toHaveLength(1);
  });
});

describe("sameSelection", () => {
  it("compares kind, container, and the entity key", () => {
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 1 })).toBe(true);
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 2 })).toBe(false);
    expect(
      isSameSelection({ kind: "binding", containerId: 1, token: "A" }, { kind: "binding", containerId: 1, token: "A" })
    ).toBe(true);
    expect(
      isSameSelection({ kind: "binding", containerId: 1, token: "A" }, { kind: "binding", containerId: 1, token: "B" })
    ).toBe(false);
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "plugin", containerId: 1, name: "A" })).toBe(
      false
    );
  });
});

describe("rootIdOfContainer", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1)]),
    mockRootSnapshot(7, [mockContainerSnapshot(3, null)]),
  ];

  it("returns the rootId owning the container", () => {
    expect(rootIdOfContainer(roots, 2)).toBe(1);
    expect(rootIdOfContainer(roots, 3)).toBe(7);
  });

  it("returns undefined for an unknown container", () => {
    expect(rootIdOfContainer(roots, 999)).toBeUndefined();
  });
});

describe("buildMessageResults", () => {
  it("indexes messageResult deltas by messageId and ignores other kinds", () => {
    const results = buildMessageResults([
      mockMessageEvent({ message: { id: 1, channel: "command", type: "X" } }),
      mockMessageResultEvent({ messageId: 1, outcome: "resolved", value: 42 }),
      mockLifecycleEvent({ containerId: 1, phase: "activate" }),
      mockMessageResultEvent({ messageId: 2, outcome: "rejected" }),
    ]);

    expect(results.size).toBe(2);
    expect(results.get(1)?.value).toBe(42);
    expect(results.get(2)?.outcome).toBe("rejected");
    expect(results.get(99)).toBeUndefined();
  });

  it("keeps the last result when a messageId repeats", () => {
    const results = buildMessageResults([
      mockMessageResultEvent({ messageId: 1, outcome: "resolved" }),
      mockMessageResultEvent({ messageId: 1, outcome: "rejected" }),
    ]);

    expect(results.get(1)?.outcome).toBe("rejected");
  });
});
