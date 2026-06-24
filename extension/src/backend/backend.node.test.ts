import { createInspectNode, createServiceInspectNode } from "@/backend/backend.node";

describe("createServiceInspectNode", () => {
  it("describes a field that references another tracked instance, carrying jump coordinates", () => {
    expect(createServiceInspectNode({ className: "Logger", containerId: 2, instanceId: 7 })).toEqual({
      kind: "service",
      preview: "Logger",
      className: "Logger",
      containerId: 2,
      instanceId: 7,
    });
  });
});

describe("createInspectNode", () => {
  it("describes primitives inline", () => {
    expect(createInspectNode(5)).toEqual({ kind: "primitive", value: 5 });
    expect(createInspectNode("hi")).toEqual({ kind: "primitive", value: "hi" });
    expect(createInspectNode(true)).toEqual({ kind: "primitive", value: true });
    expect(createInspectNode(null)).toEqual({ kind: "primitive", value: null });
  });

  it("describes an object as its child keys (one level — no recursion)", () => {
    const node = createInspectNode({ a: 1, b: { deep: true } });

    expect(node.kind).toBe("object");
    if (node.kind === "object") {
      expect(node.keys).toEqual(["a", "b"]);
    }
  });

  it("names class instances", () => {
    class User {
      public name: string = "x";
    }
    const node = createInspectNode(new User());

    expect(node.kind).toBe("object");
    if (node.kind === "object") {
      expect(node.preview).toBe("User");
      expect(node.keys).toEqual(["name"]);
    }
  });

  it("describes arrays by length", () => {
    expect(createInspectNode([1, 2, 3])).toMatchObject({ kind: "array", length: 3 });
  });

  it("marks non-expandable leaves", () => {
    expect(createInspectNode(() => 1).kind).toBe("leaf");
    expect(createInspectNode(undefined)).toEqual({ kind: "leaf", preview: "undefined" });
    expect(createInspectNode(new Map([["k", 1]])).kind).toBe("leaf");
    expect(createInspectNode(new Set([1])).kind).toBe("leaf");
  });
});
