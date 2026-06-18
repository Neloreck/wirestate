import { describe, expect, it } from "vitest";

import { describeNode, serviceNode } from "@/backend/inspect";

describe("describeNode", () => {
  it("describes primitives inline", () => {
    expect(describeNode(5)).toEqual({ t: "primitive", value: 5 });
    expect(describeNode("hi")).toEqual({ t: "primitive", value: "hi" });
    expect(describeNode(true)).toEqual({ t: "primitive", value: true });
    expect(describeNode(null)).toEqual({ t: "primitive", value: null });
  });

  it("describes an object as its child keys (one level — no recursion)", () => {
    const node = describeNode({ a: 1, b: { deep: true } });

    expect(node.t).toBe("object");
    if (node.t === "object") {
      expect(node.keys).toEqual(["a", "b"]);
    }
  });

  it("names class instances", () => {
    class User {
      public name: string = "x";
    }
    const node = describeNode(new User());

    expect(node.t).toBe("object");
    if (node.t === "object") {
      expect(node.preview).toBe("User");
      expect(node.keys).toEqual(["name"]);
    }
  });

  it("describes arrays by length", () => {
    expect(describeNode([1, 2, 3])).toMatchObject({ t: "array", length: 3 });
  });

  it("marks non-expandable leaves", () => {
    expect(describeNode(() => 1).t).toBe("leaf");
    expect(describeNode(undefined)).toEqual({ t: "leaf", preview: "undefined" });
    expect(describeNode(new Map([["k", 1]])).t).toBe("leaf");
    expect(describeNode(new Set([1])).t).toBe("leaf");
  });
});

describe("serviceNode", () => {
  it("describes a field that references another tracked instance, carrying jump coordinates", () => {
    expect(serviceNode({ className: "Logger", containerId: 2, instanceId: 7 })).toEqual({
      t: "service",
      preview: "Logger",
      className: "Logger",
      containerId: 2,
      instanceId: 7,
    });
  });
});
