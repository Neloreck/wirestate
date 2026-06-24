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

import { type TimelineFilter } from "@/panel/hooks/use-panel-state";
import { isSameSelection } from "@/panel/lib/selection";
import {
  getBindingStatus,
  buildMessageResults,
  buildRoots,
  collapseTimeline,
  getChannelOfEvent,
  childContainers,
  filterLogBy,
  getLifecycleHistory,
  mayRealizeInstance,
  realizingInstance,
  resolveSelection,
  rootIdOfContainer,
  getTokenOfInstanceId,
} from "@/panel/lib/selectors";

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

    const containerNode = built[0].nodes.find((node) => node.container.containerId === 1);

    expect(containerNode?.children.map((child) => child.container.containerId).sort()).toEqual([2, 3]);
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
    const containerSnapshot = mockContainerSnapshot(1, null, {
      instances: [mockInstance("ServiceImplementation", "Service")],
    });

    expect(realizingInstance(containerSnapshot, mockBinding("Service"))?.className).toBe("ServiceImplementation");
    expect(realizingInstance(containerSnapshot, mockBinding("Other", "ServiceImplementation"))?.className).toBe(
      "ServiceImplementation"
    );
    expect(realizingInstance(containerSnapshot, mockBinding("None", "Nope"))).toBeUndefined();
  });

  it("mayRealizeInstance is true only for singleton instance bindings", () => {
    const mockBinding = (type: DevtoolsBinding["type"], scope: DevtoolsBinding["scope"]): DevtoolsBinding => ({
      bindingId: 1,
      token: { name: "Service", kind: "class" },
      type,
      scope,
      implementation: undefined,
    });

    expect(mayRealizeInstance(mockBinding("Instance", "Singleton"))).toBe(true);
    expect(mayRealizeInstance(mockBinding("Instance", "Transient"))).toBe(false);
    expect(mayRealizeInstance(mockBinding("Factory", "Singleton"))).toBe(false);
    expect(mayRealizeInstance(mockBinding("Value", "Singleton"))).toBe(false);
  });
});

describe("bindingStatus", () => {
  const value: DevtoolsBinding = {
    bindingId: 1,
    token: { name: "config", kind: "string" },
    type: "Value",
    scope: "Singleton",
    implementation: undefined,
  };

  // mockBinding builds an Instance/Singleton binding
  const singleton = mockBinding("Service");

  it("is 'none' for a non-instance binding (Value/Factory/Transient)", () => {
    expect(getBindingStatus(mockContainerSnapshot(1), value)).toBe("none");
  });

  it("is 'unrealized' for a singleton instance binding with no live instance", () => {
    expect(getBindingStatus(mockContainerSnapshot(1, null, { instances: [] }), singleton)).toBe("unrealized");
  });

  it("is 'active' when the realizing instance is live", () => {
    const container = mockContainerSnapshot(1, null, { instances: [mockInstance("Service")] });

    expect(getBindingStatus(container, singleton)).toBe("active");
  });

  it("is 'inactive' when the realizing instance is inactive", () => {
    const inactive = {
      ...mockInstance("Service"),
      status: { isDeactivated: true, isDeprovisioned: true, isInactive: true, provisionId: null },
    };
    const container = mockContainerSnapshot(1, null, { instances: [inactive] });

    expect(getBindingStatus(container, singleton)).toBe("inactive");
  });
});

describe("tokenOfInstanceId", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null, { instances: [mockInstance("SvcImpl", "Service", 7)] })]),
  ];

  it("maps an instance id to its realizing binding's token", () => {
    expect(getTokenOfInstanceId(roots, 1, 7)).toBe("Service");
  });

  it("is undefined for an unknown instance or container", () => {
    expect(getTokenOfInstanceId(roots, 1, 999)).toBeUndefined();
    expect(getTokenOfInstanceId(roots, 999, 7)).toBeUndefined();
  });
});

describe("channelOf", () => {
  it("reads the channel for message/registration and undefined for lifecycle", () => {
    expect(getChannelOfEvent(mockMessageEvent({ containerId: 1, message: { channel: "command", type: "X" } }))).toBe(
      "command"
    );
    expect(
      getChannelOfEvent(mockRegistrationEvent({ containerId: 1, registration: { channel: "event", type: "Y" } }))
    ).toBe("event");
    expect(getChannelOfEvent(mockLifecycleEvent({ containerId: 1, phase: "activate" }))).toBeUndefined();
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
    expect(getLifecycleHistory(log, 1)).toHaveLength(2);
    expect(getLifecycleHistory(log, 1, { className: "Foo" })).toHaveLength(2);
    expect(getLifecycleHistory(log, 1, { className: "Other" })).toHaveLength(0);
  });

  it("narrows by instanceId when the target carries one", () => {
    const discriminated: ReadonlyArray<DevtoolsEvent> = [
      mockLifecycleEvent({ instance: mockInstance("Foo", "Foo", 1) }),
      mockLifecycleEvent({ phase: "provision", instance: mockInstance("Foo", "Foo", 2) }),
    ];

    expect(getLifecycleHistory(discriminated, 1, { instanceId: 1, className: "Foo" })).toHaveLength(1);
    expect(getLifecycleHistory(discriminated, 1, { instanceId: 2, className: "Foo" })).toHaveLength(1);
    expect(getLifecycleHistory(discriminated, 1, { className: "Foo" })).toHaveLength(2);
  });
});

describe("filterLog", () => {
  function mockTimelineFilter(partial: Partial<TimelineFilter> = {}): TimelineFilter {
    return {
      rootId: undefined,
      containerId: undefined,
      kinds: { lifecycle: true, message: true, registration: true },
      channels: { event: true, command: true, query: true },
      text: "",
      ...partial,
    };
  }

  const log = [
    mockLifecycleEvent({ containerId: 1, phase: "activate" }),
    mockMessageEvent({ containerId: 1, message: { channel: "command", type: "X" } }),
    mockRegistrationEvent({ rootId: 2, containerId: 2, registration: { channel: "event", type: "Y" } }),
  ];

  it("passes everything by default", () => {
    expect(filterLogBy(log, mockTimelineFilter())).toHaveLength(3);
  });

  it("filters by kind, root, container, channel, and text", () => {
    expect(
      filterLogBy(log, mockTimelineFilter({ kinds: { lifecycle: false, message: true, registration: false } }))
    ).toHaveLength(1);
    expect(filterLogBy(log, mockTimelineFilter({ rootId: 1 }))).toHaveLength(2);
    expect(filterLogBy(log, mockTimelineFilter({ containerId: 1 }))).toHaveLength(2);
    expect(
      filterLogBy(log, mockTimelineFilter({ channels: { event: true, command: false, query: true } }))
    ).toHaveLength(2);
    expect(filterLogBy(log, mockTimelineFilter({ text: "X" }))).toHaveLength(1);
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

describe("collapseTimeline", () => {
  it("collapses a run of identical deltas into one row carrying the repeat count", () => {
    const rows = collapseTimeline([
      mockLifecycleEvent({ phase: "activate", className: "Worker" }),
      mockLifecycleEvent({ phase: "activate", className: "Worker" }),
      mockLifecycleEvent({ phase: "activate", className: "Worker" }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(3);
  });

  it("keeps non-adjacent identical deltas as separate runs", () => {
    const rows = collapseTimeline([
      mockLifecycleEvent({ phase: "activate", className: "A" }),
      mockLifecycleEvent({ phase: "activate", className: "A" }),
      mockLifecycleEvent({ phase: "activate", className: "B" }),
      mockLifecycleEvent({ phase: "activate", className: "A" }),
    ]);

    expect(rows.map((row) => row.count)).toEqual([2, 1, 1]);
  });

  it("keeps the first delta of each run as the row's event", () => {
    const first = mockLifecycleEvent({ phase: "activate", className: "A" });
    const rows = collapseTimeline([first, mockLifecycleEvent({ phase: "activate", className: "A" })]);

    expect(rows[0].event).toBe(first);
  });

  it("returns an empty list for no deltas", () => {
    expect(collapseTimeline([])).toEqual([]);
  });
});
