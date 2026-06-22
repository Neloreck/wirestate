import { type DehydratedRef, dehydrate } from "@/backend/backend.dehydrate";

function asRef(value: unknown): DehydratedRef {
  return value as DehydratedRef;
}

describe("dehydrate", () => {
  it("passes through JSON-safe primitives", () => {
    expect(dehydrate("a")).toBe("a");
    expect(dehydrate(1)).toBe(1);
    expect(dehydrate(true)).toBe(true);
    expect(dehydrate(null)).toBeNull();
  });

  it("marks the non-clonable scalars", () => {
    expect(asRef(dehydrate(undefined)).__wsType).toBe("undefined");
    expect(asRef(dehydrate(() => 1)).__wsType).toBe("function");
    expect(asRef(dehydrate(Symbol("s"))).__wsType).toBe("symbol");
    expect(asRef(dehydrate(10n)).__wsType).toBe("bigint");
  });

  it("detects cycles instead of overflowing", () => {
    const a: Record<string, unknown> = {};

    a.self = a;

    const out = dehydrate(a) as Record<string, DehydratedRef>;

    expect(out.self.__wsType).toBe("circular");
  });

  it("wraps class instances with their class name and own props", () => {
    class Foo {
      public x: number = 1;
    }

    const out = asRef(dehydrate(new Foo()));

    expect(out.__wsType).toBe("instance");

    if (out.__wsType === "instance") {
      expect(out.className).toBe("Foo");
      expect(out.value).toEqual({ x: 1 });
    }
  });

  it("marks Map and Set", () => {
    expect(asRef(dehydrate(new Map([["k", 1]]))).__wsType).toBe("map");
    expect(asRef(dehydrate(new Set([1, 2]))).__wsType).toBe("set");
  });

  it("truncates large arrays with a marker", () => {
    const out = dehydrate(Array.from({ length: 200 }, (_, index) => index)) as Array<unknown>;

    expect(out).toHaveLength(129);
    expect(asRef(out[128]).__wsType).toBe("truncated");
  });

  it("caps recursion depth", () => {
    let deep: Record<string, unknown> = { value: 1 };

    for (let level = 0; level < 10; level += 1) {
      deep = { nested: deep };
    }

    expect(JSON.stringify(dehydrate(deep))).toContain("maxDepth");
  });

  it("produces structured-clone-safe output (the whole point of the pass)", () => {
    const out = dehydrate({ fn: () => 1, when: new Date(0), nested: { sym: Symbol("x") } });

    expect(() => structuredClone(out)).not.toThrow();
  });
});
