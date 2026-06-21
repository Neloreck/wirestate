import { type DevtoolsEvent } from "@wirestate/core/devtools";

import {
  mockLifecycleEvent,
  mockLifecycleEventWithoutTimestamp,
  mockMessageEvent,
  mockMessageResultEvent,
} from "@/fixtures/devtools";

import { dehydrate } from "@/backend/backend.dehydrate";
import { sanitizeDevtoolsEvent, stampTime } from "@/backend/backend.utils";

function getTimestampOf(event: DevtoolsEvent): unknown {
  return (event as { timestamp?: number }).timestamp;
}

describe("sanitize", () => {
  it("dehydrates a message delta's payload and source", () => {
    const payload = { hello: "world" };
    const source = { from: "svc" };
    const result = sanitizeDevtoolsEvent(mockMessageEvent({ message: { payload, source } }));

    expect(result.kind).toBe("message");
    if (result.kind === "message") {
      expect(result.message.payload).toEqual(dehydrate(payload));
      expect(result.message.source).toEqual(dehydrate(source));
    }
  });

  it("dehydrates a messageResult delta's value", () => {
    const value = { big: "object" };
    const result = sanitizeDevtoolsEvent(mockMessageResultEvent({ value }));

    if (result.kind === "messageResult") {
      expect(result.value).toEqual(dehydrate(value));
    }
  });

  it("passes other deltas through unchanged (by reference)", () => {
    const event = mockLifecycleEvent({ timestamp: 5 });

    expect(sanitizeDevtoolsEvent(event)).toBe(event);
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
