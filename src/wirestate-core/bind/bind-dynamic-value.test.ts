import { bindingTypeValues, Container } from "inversify";

import { ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { AnyObject } from "../types/general";
import { InjectableDescriptor } from "../types/provision";

import { bindDynamicValue } from "./bind-dynamic-value";

describe("bindDynamicValue", () => {
  it("should bind a value using toDynamicValue", () => {
    const container: Container = new Container();
    const value: AnyObject = { a: 1, b: 2 };

    bindDynamicValue(container, { id: "static-value-ref", value: value });

    expect(container.get("static-value-ref")).toEqual({ a: 1, b: 2 });
    expect(container.get("static-value-ref")).toBe(value);
  });

  it("should bind a factory function using toDynamicValue", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    bindDynamicValue(container, { id: "factory-value", factory });

    expect(container.get("factory-value")).toEqual({ c: 3, d: 4 });
    expect(container.get("factory-value")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should respect Singleton scope", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
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

  it("should throw if id is missing", () => {
    const container: Container = new Container();
    const entry = { value: "my-value" } as unknown as InjectableDescriptor;

    expect(() => bindDynamicValue(container, entry)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindDynamicValue(container, entry)).toThrow("Injectable descriptor must provide an 'id' token.");
  });

  it("should throw if neither factory nor value is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        id: "missing-dynamic-source",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        id: "missing-dynamic-source",
      })
    ).toThrow("Dynamic value descriptor must provide either a 'factory' or 'value' property.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        bindingType: bindingTypeValues.ConstantValue,
        id: "constant-value",
        value: "my-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        bindingType: bindingTypeValues.ConstantValue,
        id: "constant-value",
        value: "my-value",
      })
    ).toThrow("bindDynamicValue expected binding type 'DynamicValue'.");
  });

  it("should throw if factory is not a function", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw if scopeBindingType is not in allowed list", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        factory: () => "my-value",
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bindDynamicValue(container, {
        factory: () => "my-value",
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
      })
    ).toThrow("Injectable descriptor has unknown scope binding type 'UNKNOWN'.");
  });
});
