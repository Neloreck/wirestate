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
});
