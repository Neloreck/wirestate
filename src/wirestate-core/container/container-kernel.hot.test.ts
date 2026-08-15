import { getHotState, registerHotModule } from "../hot/hot-registry";
import { Injectable } from "../metadata/metadata-injectable";
import { type Newable } from "../types/general";

import { Container } from "./container";

/**
 * Every public API that accepts a token or a binding, and therefore has to route through the
 * hot-reload rewrite to stay answerable for a reference from a module that was not hot-updated.
 *
 * @remarks
 * Kept as an explicit list so adding a token-accepting method is a deliberate decision: the
 * surface test below fails until the new method is listed here and covered by a case.
 */
const TOKEN_ACCEPTING_METHODS: ReadonlyArray<string> = ["bind", "get", "has", "hasOwn", "unbind"];

/**
 * Public methods of `Container` that take no token, so they need no rewrite.
 */
const TOKEN_FREE_METHODS: ReadonlyArray<string> = [
  "constructor",
  "deprovision",
  "destroy",
  "getActiveInstances",
  "getOwnBindings",
  "provision",
  "unbindAll",
];

/**
 * Internals reached only through the methods above, which receive already-rewritten tokens.
 */
const INTERNAL_METHODS: ReadonlyArray<string> = [
  "assertUsable",
  "commit",
  "deactivate",
  "deactivateRecord",
  "evict",
  "hasBinding",
  "hasConstructedBinding",
  "getHotBinding",
  "getHotToken",
  "resolve",
  "retainBinding",
];

describe("ContainerKernel hot-reload token rewriting", () => {
  beforeEach(() => {
    getHotState().latest.clear();
    getHotState().dirty.clear();
    getHotState().owners.clear();
  });

  /**
   * Registers two generations of a class, as a module edit followed by its hot update would.
   *
   * @returns The stale reference other modules still hold, and the replacement.
   */
  function createReplacedService(): { stale: Newable<object>; latest: Newable<object> } {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("services/service.ts", { Service: ServiceV1 });
    registerHotModule("services/service.ts", { Service: ServiceV2 });

    return { stale: ServiceV1, latest: ServiceV2 };
  }

  it("should register a stale bare class under its newest generation", () => {
    const { stale, latest } = createReplacedService();
    const container: Container = new Container({ bindings: [stale] });

    expect(container.getOwnBindings().some((binding) => binding.token === latest)).toBe(true);
    expect(container.getOwnBindings().some((binding) => binding.token === stale)).toBe(false);
  });

  it("should register a stale instance descriptor under its newest generation", () => {
    const { stale, latest } = createReplacedService();
    const container: Container = new Container();

    container.bind({ token: stale, type: "Instance", value: stale });

    expect(container.get(stale)).toBeInstanceOf(latest);
    expect(container.get(stale)).toBe(container.get(latest));
  });

  it("should resolve a stale reference through get", () => {
    const { stale, latest } = createReplacedService();
    const container: Container = new Container({ bindings: [stale] });

    expect(container.get(stale)).toBeInstanceOf(latest);
    expect(container.get(stale, { optional: true })).toBeInstanceOf(latest);
    expect(container.get<object>(stale, { lazy: true })()).toBeInstanceOf(latest);
  });

  it("should resolve a stale reference through a parent chain", () => {
    const { stale, latest } = createReplacedService();
    const parent: Container = new Container({ bindings: [stale] });
    const child: Container = new Container({ parent });

    expect(child.get(stale)).toBeInstanceOf(latest);
    expect(child.has(stale)).toBe(true);
    expect(child.hasOwn(stale)).toBe(false);
  });

  it("should answer has and hasOwn for a stale reference", () => {
    const { stale } = createReplacedService();
    const container: Container = new Container({ bindings: [stale] });

    expect(container.has(stale)).toBe(true);
    expect(container.hasOwn(stale)).toBe(true);
  });

  it("should unbind through a stale reference", () => {
    const { stale, latest } = createReplacedService();
    const container: Container = new Container({ bindings: [stale] });

    container.unbind(stale);

    expect(container.has(stale)).toBe(false);
    expect(container.has(latest)).toBe(false);
    expect(container.getOwnBindings()).toHaveLength(1); // Container binds itself.
  });

  it("should leave tokens that are not hot-replaced classes untouched", () => {
    @Injectable()
    class PlainService {}

    const container: Container = new Container({ bindings: [PlainService, { token: "config", value: 1 }] });

    expect(container.get(PlainService)).toBeInstanceOf(PlainService);
    expect(container.get("config")).toBe(1);
    expect(container.has("missing")).toBe(false);
    expect(container.hasOwn(PlainService)).toBe(true);
  });

  it("should not rewrite a stale reference when only the older generation is bound", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("services/service.ts", { Service: ServiceV1 });

    // Bound before the update, and never swapped: an external container the runtime does not own.
    const container: Container = new Container({ bindings: [ServiceV1] });

    registerHotModule("services/service.ts", { Service: ServiceV2 });

    expect(container.get(ServiceV1)).toBeInstanceOf(ServiceV1);
    expect(container.has(ServiceV1)).toBe(true);
    expect(container.hasOwn(ServiceV1)).toBe(true);
    expect(container.has(ServiceV2)).toBe(false);
  });

  it("should cover every public method of the container surface", () => {
    const surface: Array<string> = Object.getOwnPropertyNames(Container.prototype)
      .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(Container.prototype)))
      .filter((name) => !name.startsWith("_"))
      .filter((name, index, all) => all.indexOf(name) === index)
      .sort();

    // A new method must be classified: either it takes a token and routes through the rewrite
    // with a case above, or it takes none, or it is an internal that receives already-rewritten
    // tokens. Hot-reload support silently missing from a method is exactly how `hasOwn` and
    // `unbind` were first shipped without it.
    expect(surface).toEqual([...TOKEN_ACCEPTING_METHODS, ...TOKEN_FREE_METHODS, ...INTERNAL_METHODS].sort());
  });
});
