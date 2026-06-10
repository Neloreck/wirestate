import { BindingType, BindingScope, Container } from "../alias";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { AnyObject } from "../types/general";
import { FactoryBindingDescriptor } from "../types/provision";

import { bindFactory } from "./bind-factory";
import { getContainerBindings } from "./utils/register-binding";

describe("bindFactory", () => {
  it("should bind a factory creator", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("greeting-factory");
    const binding: FactoryBindingDescriptor<() => string> = {
      type: BindingType.Factory,
      factory: () => () => "hello",
      token: TOKEN,
    };

    const result: Container = bindFactory(container, binding);

    const factory: () => string = container.get(TOKEN);

    expect(result).toBe(container);
    expect(factory()).toBe("hello");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should call factory once and cache the value by default", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    const result: Container = bindFactory(container, {
      type: BindingType.Factory,
      token: "factory-value",
      factory,
    });

    expect(result).toBe(container);
    expect(container.get("factory-value")).toEqual({ c: 3, d: 4 });
    expect(container.get("factory-value")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should pass container to factory", () => {
    const container: Container = new Container();
    const NAME_TOKEN: unique symbol = Symbol("name");
    const GREETING_TOKEN: unique symbol = Symbol("greeting");
    const factory = jest.fn((current: Container) => `Hello, ${current.get<string>(NAME_TOKEN)}`);

    container.bind({ token: NAME_TOKEN, value: "Ada" });

    bindFactory(container, {
      type: BindingType.Factory,
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

    bindFactory(container, {
      type: BindingType.Factory,
      token: "factory-singleton",
      factory,
      scope: BindingScope.Singleton,
    });

    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);
    expect(container.get("factory-singleton")).toBe(value);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should respect Transient scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindFactory(container, {
      type: BindingType.Factory,
      token: "factory-transient",
      factory: () => count++,
      scope: BindingScope.Transient,
    });

    expect(container.get("factory-transient")).toBe(0);
    expect(container.get("factory-transient")).toBe(1);
    expect(container.get("factory-transient")).toBe(2);
  });

  it("should reject removed Request scope", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "factory-request",
        factory: () => 0,
        scope: "Request",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "factory-request",
        factory: () => 0,
        scope: "Request",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope 'Request'.");
  });

  it("should throw if scope is not in allowed list", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        factory: () => "my-value",
        token: "bad-scope",
        scope: "UNKNOWN",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        factory: () => "my-value",
        token: "bad-scope",
        scope: "UNKNOWN",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = {
      type: BindingType.Factory,
      factory: () => () => "value",
    } as unknown as FactoryBindingDescriptor;

    expect(() => bindFactory(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindFactory(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if factory is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "factory-binding",
      } as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "factory-binding",
      } as FactoryBindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  it("should throw if value is provided instead of factory", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "static-value-ref",
        value: { a: 1, b: 2 },
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        token: "static-value-ref",
        value: { a: 1, b: 2 },
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  it("should throw if factory is not a function", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  it("should throw if descriptor uses another type", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.Value,
        factory: () => () => "value",
        token: "factory-binding",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.Value,
        factory: () => () => "value",
        token: "factory-binding",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("bindFactory expected type 'Factory'.");
  });
});
