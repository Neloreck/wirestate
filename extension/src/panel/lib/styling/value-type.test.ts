import { inspectNodeToValueColor } from "@/panel/lib/styling/value-type";

describe("nodeToValueColor", () => {
  it("classifies primitive scalars by their type", () => {
    expect(inspectNodeToValueColor({ kind: "primitive", value: "hi" })).toBe("string");
    expect(inspectNodeToValueColor({ kind: "primitive", value: 42 })).toBe("number");
    expect(inspectNodeToValueColor({ kind: "primitive", value: true })).toBe("boolean");
  });

  it("treats null and undefined as nullish", () => {
    expect(inspectNodeToValueColor({ kind: "primitive", value: null })).toBe("nullish");
    expect(inspectNodeToValueColor({ kind: "leaf", preview: "undefined" })).toBe("nullish");
  });

  it("detects function leaves by their ƒ preview", () => {
    expect(inspectNodeToValueColor({ kind: "leaf", preview: "ƒ run()" })).toBe("function");
  });

  it("leaves other nodes neutral", () => {
    expect(inspectNodeToValueColor({ kind: "leaf", preview: "Map(2)" })).toBe("neutral");
    expect(inspectNodeToValueColor({ kind: "object", preview: "{…}", keys: ["a"] })).toBe("neutral");
    expect(inspectNodeToValueColor({ kind: "array", preview: "Array(3)", length: 3 })).toBe("neutral");
    expect(
      inspectNodeToValueColor({ kind: "service", preview: "Svc", className: "Svc", containerId: 1, instanceId: 2 })
    ).toBe("neutral");
    expect(inspectNodeToValueColor({ kind: "unsupported" })).toBe("neutral");
  });
});
