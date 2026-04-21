import { bindingScopeValues, bindingTypeValues, Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { bindEntry } from "@/wirestate/core/bind/bind-entry";
import { mockContainer } from "@/wirestate/test-utils/mock-container";

describe("bindEntry", () => {
  it("should bind a service class directly", () => {
    const container: Container = mockContainer();

    bindEntry(container, GenericService);

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind a constant value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bindEntry(container, {
      id: TOKEN,
      value: { key: "value" },
      bindingType: bindingTypeValues.ConstantValue,
    });

    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a constant value when type is undefined", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bindEntry(container, { id: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a dynamic value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    bindEntry(container, {
      id: TOKEN,
      value: null,
      bindingType: bindingTypeValues.DynamicValue,
      scopeBindingType: bindingScopeValues.Transient,
      factory: () => {
        callCount++;

        return { count: callCount };
      },
    });

    expect(container.get(TOKEN)).toEqual({ count: 1 });
    expect(container.get(TOKEN)).toEqual({ count: 2 });
    expect(container.get(TOKEN)).toEqual({ count: 3 });
  });

  it("should fall back to value for dynamic binding without factory", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic-fallback");

    bindEntry(container, {
      id: TOKEN,
      value: Math.random(),
      bindingType: bindingTypeValues.DynamicValue,
    });

    const first: number = container.get(TOKEN);
    const second: number = container.get(TOKEN);

    expect(typeof first).toBe("number");
    expect(typeof second).toBe("number");
    expect(first).toBe(second);
  });
});
