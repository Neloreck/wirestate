import type { ResolutionContext } from "inversify";

import { Container, BindingType, ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { AnyObject } from "../types/general";
import { DynamicValueBindingDescriptor } from "../types/provision";

import { bindDynamicValue } from "./bind-dynamic-value";

describe("bindDynamicValue", () => {
  it("should bind a factory function using toDynamicValue", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    const result: Container = bindDynamicValue(container, {
      bindingType: BindingType.DynamicValue,
      token: "factory-value",
      factory,
    });

    expect(result).toBe(container);
    expect(container.get("factory-value")).toEqual({ c: 3, d: 4 });
    expect(container.get("factory-value")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should pass resolution context to factory", () => {
    const container: Container = new Container();
    const NAME_TOKEN: unique symbol = Symbol("name");
    const GREETING_TOKEN: unique symbol = Symbol("greeting");
    const factory = jest.fn((context: ResolutionContext) => `Hello, ${context.get(NAME_TOKEN)}`);

    container.bind(NAME_TOKEN).toConstantValue("Ada");

    bindDynamicValue(container, {
      bindingType: BindingType.DynamicValue,
      factory,
      token: GREETING_TOKEN,
    });

    expect(container.get(GREETING_TOKEN)).toBe("Hello, Ada");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should respect Singleton scope", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    bindDynamicValue(container, {
      bindingType: BindingType.DynamicValue,
      token: "factory-singleton",
      factory,
      scopeBindingType: ScopeBindingType.Singleton,
    });

    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should respect Transient scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindDynamicValue(container, {
      bindingType: BindingType.DynamicValue,
      token: "factory-transient",
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
      bindingType: BindingType.DynamicValue,
      token: "factory-request",
      factory: () => count++,
      scopeBindingType: ScopeBindingType.Request,
    });

    // In inversify Request scope is per .get() if not in same request context
    expect(container.get("factory-request")).toBe(0);
    expect(container.get("factory-request")).toBe(1);
    expect(container.get("factory-request")).toBe(2);
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = { value: "my-value" } as unknown as DynamicValueBindingDescriptor;

    expect(() => bindDynamicValue(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindDynamicValue(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if factory is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        token: "missing-dynamic-source",
      } as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        token: "missing-dynamic-source",
      } as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw if value is provided instead of factory", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.DynamicValue,
        token: "static-value-ref",
        value: { a: 1, b: 2 },
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.DynamicValue,
        token: "static-value-ref",
        value: { a: 1, b: 2 },
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw if factory is undefined", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.DynamicValue,
        factory: undefined,
        token: "undefined-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.DynamicValue,
        factory: undefined,
        token: "undefined-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.ConstantValue,
        token: "constant-value",
        value: "my-value",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        bindingType: BindingType.ConstantValue,
        token: "constant-value",
        value: "my-value",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("bindDynamicValue expected binding type 'DynamicValue'.");
  });

  it("should throw if factory is not a function", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindDynamicValue(container, {
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw if scopeBindingType is not in allowed list", () => {
    const container: Container = new Container();

    expect(() =>
      bindDynamicValue(container, {
        factory: () => "my-value",
        token: "bad-scope",
        scopeBindingType: "UNKNOWN",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bindDynamicValue(container, {
        factory: () => "my-value",
        token: "bad-scope",
        scopeBindingType: "UNKNOWN",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope binding type 'UNKNOWN'.");
  });
});
