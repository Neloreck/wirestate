import {
  type DevtoolsBinding,
  type DevtoolsContainerSnapshot,
  type DevtoolsEvent,
  type DevtoolsInstance,
  type DevtoolsLifecyclePhase,
  type DevtoolsMessageChannel,
  type DevtoolsPluginInfo,
  type DevtoolsRootSnapshot,
} from "@wirestate/core/devtools";
import { describe, expect, it } from "vitest";

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

const instance = (className: string, token: string = className, instanceId = 1): DevtoolsInstance => ({
  instanceId,
  token: { name: token, kind: "class" },
  className,
  status: undefined,
  handlers: [],
});

const binding = (name: string, implementation?: string): DevtoolsBinding => ({
  token: { name, kind: "class" },
  type: "Instance",
  scope: "Singleton",
  implementation,
});

const plugin = (name: string): DevtoolsPluginInfo => ({ name, handles: [] });

const container = (
  containerId: number,
  parentContainerId: number | null,
  extra: Partial<DevtoolsContainerSnapshot> = {}
): DevtoolsContainerSnapshot => ({
  containerId,
  parentContainerId,
  bindings: [],
  instances: [],
  plugins: [],
  ...extra,
});

const root = (
  rootId: number,
  containers: ReadonlyArray<DevtoolsContainerSnapshot>,
  label?: string
): DevtoolsRootSnapshot => ({
  rootId,
  protocolVersion: 1,
  label,
  containers,
});

const lifecycleEvent = (
  containerId: number,
  phase: DevtoolsLifecyclePhase,
  className?: string,
  rootId = 1
): DevtoolsEvent => ({
  kind: "lifecycle",
  rootId,
  containerId,
  timestamp: 0,
  phase,
  instance: className ? instance(className) : undefined,
});

const messageEvent = (
  containerId: number,
  channel: DevtoolsMessageChannel,
  type: string,
  rootId = 1
): DevtoolsEvent => ({
  kind: "message",
  rootId,
  containerId,
  message: { id: 0, channel, type, payload: null, source: undefined, timestamp: 0 },
});

const registrationEvent = (
  containerId: number,
  channel: DevtoolsMessageChannel,
  type: string,
  rootId = 1
): DevtoolsEvent => ({
  kind: "registration",
  rootId,
  containerId,
  timestamp: 0,
  registration: { channel, type, phase: "registered" },
});

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
    const roots = [root(1, [container(1, null), container(2, 1), container(3, 1), container(4, 99)])];
    const built = buildRoots(roots);

    expect(built).toHaveLength(1);
    expect(built[0].nodes.map((node) => node.container.containerId).sort()).toEqual([1, 4]);

    const c1 = built[0].nodes.find((node) => node.container.containerId === 1);

    expect(c1?.children.map((child) => child.container.containerId).sort()).toEqual([2, 3]);
  });

  it("derives a label with id and container count", () => {
    const built = buildRoots([root(1, [container(1, null), container(2, 1)])]);

    expect(built[0].label).toContain("#1");
    expect(built[0].label).toContain("2 containers");
  });

  it("prefers a configured root label over the derived hint", () => {
    expect(buildRoots([root(1, [container(1, null)], "My App")])[0].label).toBe("My App");
  });
});

describe("resolveSelection", () => {
  const roots = [
    root(1, [
      container(1, null, { instances: [instance("Foo")], bindings: [binding("Bar")], plugins: [plugin("Baz")] }),
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
  const roots = [root(1, [container(1, null), container(2, 1), container(3, 1)])];

  it("childContainers finds children by parent", () => {
    expect(
      childContainers(roots, 1)
        .map((child) => child.containerId)
        .sort()
    ).toEqual([2, 3]);
    expect(childContainers(roots, 2)).toHaveLength(0);
  });

  it("realizingInstance matches by token name or implementation class", () => {
    const c = container(1, null, { instances: [instance("SvcImpl", "Svc")] });

    expect(realizingInstance(c, binding("Svc"))?.className).toBe("SvcImpl");
    expect(realizingInstance(c, binding("Other", "SvcImpl"))?.className).toBe("SvcImpl");
    expect(realizingInstance(c, binding("None", "Nope"))).toBeUndefined();
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
    expect(channelOf(messageEvent(1, "command", "X"))).toBe("command");
    expect(channelOf(registrationEvent(1, "event", "Y"))).toBe("event");
    expect(channelOf(lifecycleEvent(1, "activate"))).toBeUndefined();
  });
});

describe("lifecycleHistory", () => {
  const log = [
    lifecycleEvent(1, "activate", "Foo"),
    lifecycleEvent(1, "provision", "Foo"),
    lifecycleEvent(2, "activate", "Bar"),
    messageEvent(1, "event", "ping"),
  ];

  it("filters by container, and optionally by instance (className fallback)", () => {
    expect(lifecycleHistory(log, 1)).toHaveLength(2);
    expect(lifecycleHistory(log, 1, { className: "Foo" })).toHaveLength(2);
    expect(lifecycleHistory(log, 1, { className: "Other" })).toHaveLength(0);
  });

  it("narrows by instanceId when the target carries one", () => {
    const discriminated: ReadonlyArray<DevtoolsEvent> = [
      {
        kind: "lifecycle",
        rootId: 1,
        containerId: 1,
        timestamp: 0,
        phase: "activate",
        instance: instance("Foo", "Foo", 1),
      },
      {
        kind: "lifecycle",
        rootId: 1,
        containerId: 1,
        timestamp: 0,
        phase: "provision",
        instance: instance("Foo", "Foo", 2),
      },
    ];

    expect(lifecycleHistory(discriminated, 1, { instanceId: 1, className: "Foo" })).toHaveLength(1);
    expect(lifecycleHistory(discriminated, 1, { instanceId: 2, className: "Foo" })).toHaveLength(1);
    expect(lifecycleHistory(discriminated, 1, { className: "Foo" })).toHaveLength(2);
  });
});

describe("filterLog", () => {
  const log = [lifecycleEvent(1, "activate"), messageEvent(1, "command", "X"), registrationEvent(2, "event", "Y", 2)];

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
