import { type DevtoolsEvent } from "@wirestate/core/devtools";

import {
  mockInstance,
  mockLifecycleEvent,
  mockMessageEvent,
  mockMessageResultEvent,
  mockRegistrationEvent,
} from "@/fixtures/devtools";

import { type TimelineFilter } from "@/panel/hooks/use-panel-state";
import {
  buildMessageResults,
  collapseTimeline,
  filterLogBy,
  getChannelOfEvent,
  getLifecycleHistory,
} from "@/panel/lib/deltas";

describe("getChannelOfEvent", () => {
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

describe("getLifecycleHistory", () => {
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

describe("filterLogBy", () => {
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
