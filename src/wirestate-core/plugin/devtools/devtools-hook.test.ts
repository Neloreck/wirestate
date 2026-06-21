import { DEVTOOLS_HOOK_KEY, installDevtoolsHook } from "./devtools-hook";
import { type DevtoolsEvent } from "./devtools-hook.types";

function mockLifecycleEvent(containerId: number): DevtoolsEvent {
  return { kind: "lifecycle", rootId: 1, containerId, timestamp: 0, phase: "provision", instance: undefined };
}

describe("DevtoolsHook replay buffer", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
  });

  it("replays events emitted before a late subscriber attaches", () => {
    const hook = installDevtoolsHook();

    hook.emit(mockLifecycleEvent(1));
    hook.emit(mockLifecycleEvent(2));

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });

    expect(events.map((event) => event.containerId)).toEqual([1, 2]);
  });

  it("delivers live events after the replayed backlog, duplicating neither", () => {
    const hook = installDevtoolsHook();

    hook.emit(mockLifecycleEvent(1));

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });
    hook.emit(mockLifecycleEvent(2));

    expect(events.map((event) => event.containerId)).toEqual([1, 2]);
  });

  it("does not replay to a subscriber that attached before any event", () => {
    const hook = installDevtoolsHook();

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });
    hook.emit(mockLifecycleEvent(1));

    expect(events.map((event) => event.containerId)).toEqual([1]);
  });

  it("bounds the backlog, dropping the oldest events past the cap", () => {
    const hook = installDevtoolsHook();

    for (let index = 0; index < 1100; index++) {
      hook.emit(mockLifecycleEvent(index));
    }

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });

    expect(events).toHaveLength(1024);
    expect(events[0].containerId).toBe(1100 - 1024);
    expect(events[events.length - 1].containerId).toBe(1099);
  });

  it("caps replay at the limit even before the backlog evicts", () => {
    const hook = installDevtoolsHook();

    // 1099 events: one under the eviction trigger, so the backlog has not been spliced yet.
    for (let index = 0; index < 1099; index++) {
      hook.emit(mockLifecycleEvent(index));
    }

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });

    expect(events).toHaveLength(1024);
    expect(events[0].containerId).toBe(1099 - 1024);
    expect(events[events.length - 1].containerId).toBe(1098);
  });

  it("surfaces the freshest window after repeated evictions past the buffer limit", () => {
    const hook = installDevtoolsHook();
    const total = 2000;

    for (let index = 0; index < total; index++) {
      hook.emit(mockLifecycleEvent(index));
    }

    const events: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => {
      events.push(event);
    });

    // Only the freshest 1024 survive — contiguous, in order, no gaps or duplicates across evictions.
    expect(events.map((event) => event.containerId)).toEqual(
      Array.from({ length: 1024 }, (_unused, index) => total - 1024 + index)
    );
  });

  it("replays without consuming the backlog, so later subscribers still get it", () => {
    const hook = installDevtoolsHook();

    hook.emit(mockLifecycleEvent(1));
    hook.emit(mockLifecycleEvent(2));
    hook.emit(mockLifecycleEvent(3));

    const first: Array<DevtoolsEvent> = [];
    const second: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => first.push(event));
    hook.subscribe((event) => second.push(event));

    // The second subscriber still sees the full backlog — replay's slice() did not drain it.
    expect(first.map((event) => event.containerId)).toEqual([1, 2, 3]);
    expect(second.map((event) => event.containerId)).toEqual([1, 2, 3]);

    hook.emit(mockLifecycleEvent(4));

    const third: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => third.push(event));

    expect(first.map((event) => event.containerId)).toEqual([1, 2, 3, 4]);
    expect(second.map((event) => event.containerId)).toEqual([1, 2, 3, 4]);
    expect(third.map((event) => event.containerId)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the cache intact after an eviction, so a re-subscribe replays the same window", () => {
    const hook = installDevtoolsHook();

    for (let index = 0; index < 1100; index++) {
      hook.emit(mockLifecycleEvent(index));
    }

    const first: Array<DevtoolsEvent> = [];
    const second: Array<DevtoolsEvent> = [];

    hook.subscribe((event) => first.push(event));
    hook.subscribe((event) => second.push(event));

    // Eviction trimmed the backlog to 1024 and the first replay sliced a copy; the backlog itself is
    // untouched, so the second subscriber replays the identical post-eviction window.
    const window = Array.from({ length: 1024 }, (_unused, index) => 1100 - 1024 + index);

    expect(first.map((event) => event.containerId)).toEqual(window);
    expect(second.map((event) => event.containerId)).toEqual(window);
  });
});

describe("DevtoolsHook id allocators", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
  });

  it("allocates a stable binding id per descriptor identity", () => {
    const hook = installDevtoolsHook();
    const a = {};
    const b = {};

    const idA: number = hook.idForBinding(a);

    expect(hook.idForBinding(a)).toBe(idA); // same descriptor → same id
    expect(hook.idForBinding(b)).not.toBe(idA); // distinct descriptor → distinct id
  });

  it("mints binding ids on a counter independent of containers and instances", () => {
    const hook = installDevtoolsHook();

    // The first id from each allocator is 1 — the id spaces overlap, so a binding and an instance can
    // share a numeric id. That is exactly why `inspect` and `inspectBinding` are separate methods
    // rather than one overloaded handle space.
    expect(hook.idForBinding({})).toBe(1);
    expect(hook.idForContainer({})).toBe(1);
    expect(hook.idForInstance({})).toBe(1);
  });
});
