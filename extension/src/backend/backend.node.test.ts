import { createDescribeNode, createServiceNode } from "@/backend/backend.node";

describe("describeNode", () => {
  it("describes primitives inline", () => {
    expect(createDescribeNode(5)).toEqual({ t: "primitive", value: 5 });
    expect(createDescribeNode("hi")).toEqual({ t: "primitive", value: "hi" });
    expect(createDescribeNode(true)).toEqual({ t: "primitive", value: true });
    expect(createDescribeNode(null)).toEqual({ t: "primitive", value: null });
  });

  it("describes an object as its child keys (one level — no recursion)", () => {
    const node = createDescribeNode({ a: 1, b: { deep: true } });

    expect(node.t).toBe("object");
    if (node.t === "object") {
      expect(node.keys).toEqual(["a", "b"]);
    }
  });

  it("names class instances", () => {
    class User {
      public name: string = "x";
    }
    const node = createDescribeNode(new User());

    expect(node.t).toBe("object");
    if (node.t === "object") {
      expect(node.preview).toBe("User");
      expect(node.keys).toEqual(["name"]);
    }
  });

  it("describes arrays by length", () => {
    expect(createDescribeNode([1, 2, 3])).toMatchObject({ t: "array", length: 3 });
  });

  it("marks non-expandable leaves", () => {
    expect(createDescribeNode(() => 1).t).toBe("leaf");
    expect(createDescribeNode(undefined)).toEqual({ t: "leaf", preview: "undefined" });
    expect(createDescribeNode(new Map([["k", 1]])).t).toBe("leaf");
    expect(createDescribeNode(new Set([1])).t).toBe("leaf");
  });
});

describe("serviceNode", () => {
  it("describes a field that references another tracked instance, carrying jump coordinates", () => {
    expect(createServiceNode({ className: "Logger", containerId: 2, instanceId: 7 })).toEqual({
      t: "service",
      preview: "Logger",
      className: "Logger",
      containerId: 2,
      instanceId: 7,
    });
  });
});
