import { createDescribeNode, createServiceNode } from "@/backend/backend.node";

describe("createServiceNode", () => {
  it("describes a field that references another tracked instance, carrying jump coordinates", () => {
    expect(createServiceNode({ className: "Logger", containerId: 2, instanceId: 7 })).toEqual({
      kind: "service",
      preview: "Logger",
      className: "Logger",
      containerId: 2,
      instanceId: 7,
    });
  });
});

describe("createDescribeNode", () => {
  it("describes primitives inline", () => {
    expect(createDescribeNode(5)).toEqual({ kind: "primitive", value: 5 });
    expect(createDescribeNode("hi")).toEqual({ kind: "primitive", value: "hi" });
    expect(createDescribeNode(true)).toEqual({ kind: "primitive", value: true });
    expect(createDescribeNode(null)).toEqual({ kind: "primitive", value: null });
  });

  it("describes an object as its child keys (one level — no recursion)", () => {
    const node = createDescribeNode({ a: 1, b: { deep: true } });

    expect(node.kind).toBe("object");
    if (node.kind === "object") {
      expect(node.keys).toEqual(["a", "b"]);
    }
  });

  it("names class instances", () => {
    class User {
      public name: string = "x";
    }
    const node = createDescribeNode(new User());

    expect(node.kind).toBe("object");
    if (node.kind === "object") {
      expect(node.preview).toBe("User");
      expect(node.keys).toEqual(["name"]);
    }
  });

  it("describes arrays by length", () => {
    expect(createDescribeNode([1, 2, 3])).toMatchObject({ kind: "array", length: 3 });
  });

  it("marks non-expandable leaves", () => {
    expect(createDescribeNode(() => 1).kind).toBe("leaf");
    expect(createDescribeNode(undefined)).toEqual({ kind: "leaf", preview: "undefined" });
    expect(createDescribeNode(new Map([["k", 1]])).kind).toBe("leaf");
    expect(createDescribeNode(new Set([1])).kind).toBe("leaf");
  });
});
