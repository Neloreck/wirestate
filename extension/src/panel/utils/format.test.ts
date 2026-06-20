import { mockLifecycleEvent } from "@/fixtures/devtools";

import { formatDelta, preview, stringify, summarize } from "@/panel/utils/format";

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

describe("preview", () => {
  it("renders primitives and quotes strings", () => {
    expect(preview(null)).toBe("null");
    expect(preview("hi")).toBe('"hi"');
    expect(preview(42)).toBe("42");
    expect(preview(true)).toBe("true");
  });

  it("renders arrays inline and truncates after five items", () => {
    expect(preview([1, 2, 3])).toBe("[1, 2, 3]");
    expect(preview([1, 2, 3, 4, 5, 6])).toBe("[1, 2, 3, 4, 5, …]");
  });

  it("renders plain objects inline", () => {
    expect(preview({ a: 1, b: 2 })).toBe("{a: 1, b: 2}");
  });

  it("decodes dehydrated refs", () => {
    expect(preview({ __wsType: "undefined" })).toBe("undefined");
    expect(preview({ __wsType: "instance", className: "Foo", value: { x: 1 } })).toBe("Foo {x: 1}");
    expect(preview({ __wsType: "instance" })).toBe("Object {}");
    expect(preview({ __wsType: "function", preview: "ƒ run()" })).toBe("ƒ run()");
    expect(preview({ __wsType: "circular" })).toBe("circular");
  });
});

describe("stringify", () => {
  it("renders primitives and quotes strings", () => {
    expect(stringify(null)).toBe("null");
    expect(stringify("hi")).toBe('"hi"');
    expect(stringify(42)).toBe("42");
  });

  it("renders empty and populated arrays/objects with indentation", () => {
    expect(stringify([])).toBe("[]");
    expect(stringify({})).toBe("{}");
    expect(stringify([1, 2])).toBe("[\n  1,\n  2\n]");
    expect(stringify({ a: 1 })).toBe("{\n  a: 1\n}");
  });

  it("decodes dehydrated refs", () => {
    expect(stringify({ __wsType: "undefined" })).toBe("undefined");
    expect(stringify({ __wsType: "instance", className: "Foo", value: { x: 1 } })).toBe("Foo {\n  x: 1\n}");
    expect(stringify({ __wsType: "function", preview: "ƒ run()" })).toBe("ƒ run()");
    expect(stringify({ __wsType: "circular" })).toBe("circular");
  });
});
