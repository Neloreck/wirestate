import { appendHandlerMetadata, collectHandlerMetadata } from "./metadata-handlers";

interface Entry {
  readonly methodName: string;
}

describe("appendHandlerMetadata", () => {
  it("should create the list on first use and append subsequent entries", () => {
    const registry: WeakMap<object, Array<Entry>> = new WeakMap();

    class Service {}

    appendHandlerMetadata(registry, Service, { methodName: "a" });
    appendHandlerMetadata(registry, Service, { methodName: "b" });

    expect(registry.get(Service)).toEqual([{ methodName: "a" }, { methodName: "b" }]);
  });

  it("should keep separate lists per constructor", () => {
    const registry: WeakMap<object, Array<Entry>> = new WeakMap();

    class First {}

    class Second {}

    appendHandlerMetadata(registry, First, { methodName: "a" });
    appendHandlerMetadata(registry, Second, { methodName: "b" });

    expect(registry.get(First)).toEqual([{ methodName: "a" }]);
    expect(registry.get(Second)).toEqual([{ methodName: "b" }]);
  });
});

describe("collectHandlerMetadata", () => {
  it("should return an empty array when nothing is registered", () => {
    const registry: WeakMap<object, Array<Entry>> = new WeakMap();

    class Service {}

    expect(collectHandlerMetadata(new Service(), registry)).toEqual([]);
  });

  it("should flatten the prototype chain base-to-derived", () => {
    const registry: WeakMap<object, Array<Entry>> = new WeakMap();

    class Base {}

    class Child extends Base {}

    appendHandlerMetadata(registry, Base, { methodName: "base" });
    appendHandlerMetadata(registry, Child, { methodName: "child" });

    expect(collectHandlerMetadata(new Child(), registry)).toEqual([{ methodName: "base" }, { methodName: "child" }]);
  });

  it("should preserve declaration order within a single constructor", () => {
    const registry: WeakMap<object, Array<Entry>> = new WeakMap();

    class Service {}

    appendHandlerMetadata(registry, Service, { methodName: "a" });
    appendHandlerMetadata(registry, Service, { methodName: "b" });

    expect(collectHandlerMetadata(new Service(), registry)).toEqual([{ methodName: "a" }, { methodName: "b" }]);
  });
});
