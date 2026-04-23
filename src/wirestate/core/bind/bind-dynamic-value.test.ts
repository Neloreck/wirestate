import { Container } from "inversify";

import { ScopeBindingType } from "@/wirestate/alias";
import { bindDynamicValue } from "@/wirestate/core/bind/bind-dynamic-value";
import { TAnyObject } from "@/wirestate/types/general";

describe("bindDynamicValue", () => {
  it("should bind a value using toDynamicValue", () => {
    const container: Container = new Container();
    const value: TAnyObject = { a: 1, b: 2 };

    bindDynamicValue(container, { id: "static-value-ref", value: value });

    expect(container.get("static-value-ref")).toEqual({ a: 1, b: 2 });
    expect(container.get("static-value-ref")).toBe(value);
  });

  it("should bind a factory function using toDynamicValue", () => {
    const container: Container = new Container();
    const value: TAnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    bindDynamicValue(container, { id: "factory-value", factory });

    expect(container.get("factory-value")).toEqual({ c: 3, d: 4 });
    expect(container.get("factory-value")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should respect Singleton scope", () => {
    const container: Container = new Container();
    const value: TAnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    bindDynamicValue(container, { id: "factory-singleton", factory, scopeBindingType: ScopeBindingType.Singleton });

    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should respect Transient scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindDynamicValue(container, {
      id: "factory-transient",
      factory: () => count++,
      scopeBindingType: ScopeBindingType.Transient,
    });

    expect(container.get("factory-transient")).toBe(0);
    expect(container.get("factory-transient")).toBe(1);
    expect(container.get("factory-transient")).toBe(2);
  });

  it("should respect Request scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindDynamicValue(container, {
      id: "factory-request",
      factory: () => count++,
      scopeBindingType: ScopeBindingType.Request,
    });

    // In inversify Request scope is per .get() if not in same request context
    expect(container.get("factory-request")).toBe(0);
    expect(container.get("factory-request")).toBe(1);
    expect(container.get("factory-request")).toBe(2);
  });
});
