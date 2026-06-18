import { type DevtoolsBinding, type DevtoolsEvent } from "@wirestate/core/devtools";
import { describe, expect, it } from "vitest";

import {
  mockBinding,
  mockContainerSnapshot,
  mockInstance,
  mockLifecycleEvent,
  mockMessageEvent,
  mockPluginInfo,
  mockRegistrationEvent,
  mockRootSnapshot,
} from "@/fixtures/devtools";

import {
  buildRoots,
  channelOf,
  childContainers,
  filterLog,
  lifecycleHistory,
  mayRealizeInstance,
  realizingInstance,
  resolveSelection,
} from "@/panel/selectors";
import { type TimelineFilter, sameSelection } from "@/panel/types";

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
    expect(resolveSelection(roots, { kind: "instance", containerId: 1, className: "Foo" })?.kind).toBe("instance");
    expect(resolveSelection(roots, { kind: "binding", containerId: 1, token: "Bar" })?.kind).toBe("binding");
    expect(resolveSelection(roots, { kind: "plugin", containerId: 1, name: "Baz" })?.kind).toBe("plugin");
  });

  it("returns undefined when the entity is gone (tombstone trigger)", () => {
    expect(resolveSelection(roots, { kind: "container", containerId: 999 })).toBeUndefined();
    expect(resolveSelection(roots, { kind: "instance", containerId: 1, className: "Gone" })).toBeUndefined();
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
    expect(sameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 1 })).toBe(true);
    expect(sameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 2 })).toBe(false);
    expect(
      sameSelection(
        { kind: "instance", containerId: 1, className: "A" },
        { kind: "instance", containerId: 1, className: "A" }
      )
    ).toBe(true);
    expect(
      sameSelection(
        { kind: "instance", containerId: 1, className: "A" },
        { kind: "instance", containerId: 1, className: "B" }
      )
    ).toBe(false);
    expect(sameSelection({ kind: "container", containerId: 1 }, { kind: "plugin", containerId: 1, name: "A" })).toBe(
      false
    );
  });
});
