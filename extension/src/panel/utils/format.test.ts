import { describe, expect, it } from "vitest";

import { mockLifecycleEvent } from "@/fixtures/devtools";

import { formatDelta, summarize } from "@/panel/utils/format";

describe("formatDelta", () => {
  it("formats sub-second gaps in milliseconds", () => {
    expect(formatDelta(0)).toBe("+0ms");
    expect(formatDelta(12)).toBe("+12ms");
    expect(formatDelta(999)).toBe("+999ms");
  });

  it("formats one-second-and-over gaps in seconds with one decimal", () => {
    expect(formatDelta(1000)).toBe("+1.0s");
    expect(formatDelta(1400)).toBe("+1.4s");
    expect(formatDelta(12_500)).toBe("+12.5s");
  });
});

describe("summarize", () => {
  it("renders an instance-level lifecycle delta as phase · className", () => {
    expect(summarize(mockLifecycleEvent({ phase: "activate", className: "Worker" }))).toBe("activate · Worker");
  });

  it("renders a container-level lifecycle delta as just the phase", () => {
    expect(summarize(mockLifecycleEvent({ phase: "containerProvision" }))).toBe("containerProvision");
  });
});
