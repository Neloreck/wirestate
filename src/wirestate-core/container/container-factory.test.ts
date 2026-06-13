import type { BindingDescriptor, FactoryBindingDescriptor } from "../binding/binding";
import { ERROR_CODE_CIRCULAR_DEPENDENCY } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { Container } from "./container";
import { Factory } from "./container-factory";

describe("Factory", () => {
  const container: Container = new Container();

  describe("construction strategies", () => {
    it("should return the value of a value descriptor", () => {
      const factory: Factory = new Factory(container);

      expect(factory.construct({ token: "VALUE", type: "Value", value: 42 })).toBe(42);
    });

    it("should treat a typeless descriptor that carries a value as a value binding", () => {
      const factory: Factory = new Factory(container);

      expect(factory.construct({ token: "VALUE", value: "hello" })).toBe("hello");
    });

    it("should preserve falsy and reference values", () => {
      const factory: Factory = new Factory(container);
      const reference = { nested: { a: 1 } };

      expect(factory.construct({ token: "ZERO", value: 0 })).toBe(0);
      expect(factory.construct({ token: "FALSE", value: false })).toBe(false);
      expect(factory.construct({ token: "EMPTY", value: "" })).toBe("");
      expect(factory.construct({ token: "NULL", value: null })).toBeNull();
      expect(factory.construct({ token: "REF", value: reference })).toBe(reference);
    });

    it("should construct a fresh instance for an instance descriptor on every call", () => {
      class Service {
        public id: number = 1;
      }

      const factory: Factory = new Factory(container);
      const binding: BindingDescriptor<Service> = { token: Service, type: "Instance", value: Service };

      const first: Service = factory.construct(binding);
      const second: Service = factory.construct(binding);

      expect(first).toBeInstanceOf(Service);
      expect(second).toBeInstanceOf(Service);
      // construct() never caches; the container is responsible for singletons.
      expect(first).not.toBe(second);
    });

    it("should invoke the factory of a factory descriptor and return its result", () => {
      const factory: Factory = new Factory(container);
      const result = { created: true };
      const factoryFn = jest.fn(() => result);

      expect(factory.construct({ token: "FACTORY", factory: factoryFn })).toBe(result);
      expect(factoryFn).toHaveBeenCalledTimes(1);
    });

    it("should pass the owning container to the factory function", () => {
      const factory: Factory = new Factory(container);
      const factoryFn = jest.fn(() => "value");

      factory.construct({ token: "FACTORY", factory: factoryFn });

      expect(factoryFn).toHaveBeenCalledWith(container);
    });

    it("should throw 'Invalid state.' for a descriptor with no construction strategy", () => {
      const factory: Factory = new Factory(container);
      const binding = { token: "BROKEN" } as unknown as BindingDescriptor;

      expect(() => factory.construct(binding)).toThrow(WirestateError);
      expect(() => factory.construct(binding)).toThrow("Invalid state.");
    });
  });

  describe("circular dependency detection", () => {
    it("should throw when a binding is constructed while already under construction", () => {
      const factory: Factory = new Factory(container);
      const binding: FactoryBindingDescriptor = {
        token: "SELF",
        factory: () => factory.construct(binding),
      };

      expect(() => factory.construct(binding)).toThrow(WirestateError);
    });

    it("should report the circular dependency code and a helpful message", () => {
      const factory: Factory = new Factory(container);
      const binding: FactoryBindingDescriptor = {
        token: "SELF",
        factory: () => factory.construct(binding),
      };

      let caught: unknown;

      try {
        factory.construct(binding);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(WirestateError);
      expect((caught as WirestateError).code).toBe(ERROR_CODE_CIRCULAR_DEPENDENCY);
      expect((caught as WirestateError).message).toContain("Detected circular dependency: SELF -> SELF");
      expect((caught as WirestateError).message).toContain("use lazy injection instead");
    });

    it("should render the full token chain for a multi-binding cycle", () => {
      const factory: Factory = new Factory(container);
      const a: FactoryBindingDescriptor = { token: "A", factory: () => factory.construct(b) };
      const b: FactoryBindingDescriptor = { token: "B", factory: () => factory.construct(a) };

      expect(() => factory.construct(a)).toThrow("Detected circular dependency: A -> B -> A");
    });

    it("should allow re-constructing a binding that already finished constructing", () => {
      const factory: Factory = new Factory(container);
      const binding: BindingDescriptor<number> = { token: "VALUE", value: 1 };

      expect(factory.construct(binding)).toBe(1);
      // No false positive: the binding is no longer tracked after it resolved.
      expect(factory.construct(binding)).toBe(1);
    });
  });

  describe("under-construction tracking cleanup", () => {
    it("should stop tracking a binding after its factory throws", () => {
      const factory: Factory = new Factory(container);
      const failing: FactoryBindingDescriptor = {
        token: "FAILING",
        factory: () => {
          throw new Error("boom");
        },
      };

      expect(() => factory.construct(failing)).toThrow("boom");
      // The finally block popped the binding, so an unrelated construct is unaffected...
      expect(factory.construct({ token: "OK", value: "ok" })).toBe("ok");
      // ...and retrying the failing binding surfaces its real error, not a circular dependency.
      expect(() => factory.construct(failing)).toThrow("boom");
    });

    it("should support nested construction of different bindings", () => {
      const factory: Factory = new Factory(container);
      const inner: BindingDescriptor<string> = { token: "INNER", value: "inner-value" };
      const outer: FactoryBindingDescriptor<string> = {
        token: "OUTER",
        factory: () => `outer:${factory.construct(inner)}`,
      };

      expect(factory.construct(outer)).toBe("outer:inner-value");
    });
  });
});
