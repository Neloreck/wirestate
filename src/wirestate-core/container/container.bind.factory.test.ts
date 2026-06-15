import { BindingScope, BindingType, FactoryBindingDescriptor } from "../binding/binding";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { AnyObject } from "../types/general";

import { Container } from "./container";
import { ContainerKernel } from "./container-kernel";

describe("container.bind factory", () => {
  it("should bind a factory descriptor", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    container.bind({
      token: TOKEN,
      type: BindingType.Factory,
      scope: BindingScope.Transient,
      factory: () => {
        callCount++;

        return { count: callCount };
      },
    });

    expect(container.get(TOKEN)).toEqual({ count: 1 });
    expect(container.get(TOKEN)).toEqual({ count: 2 });
    expect(container.get(TOKEN)).toEqual({ count: 3 });
  });

  it("should bind descriptors with string literal type and scope", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("literal-factory");

    const descriptor: FactoryBindingDescriptor = {
      token: TOKEN,
      type: "Factory",
      scope: "Singleton",
      factory: () => ({ value: "created" }),
    };

    container.bind(descriptor);

    const first = container.get(TOKEN);

    expect(first).toEqual({ value: "created" });
    expect(container.get(TOKEN)).toBe(first);
  });

  it("should throw for factory descriptor with invalid factory", () => {
    const container: Container = new Container();

    expect(() =>
      container.bind({
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      container.bind({
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  it("should bind a factory creator", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("greeting-factory");
    const binding: FactoryBindingDescriptor<() => string> = {
      type: BindingType.Factory,
      factory: () => () => "hello",
      token: TOKEN,
    };

    const result: Container = container.bind(binding);

    const factory: () => string = container.get(TOKEN);

    expect(result).toBe(container);
    expect(factory()).toBe("hello");
    expect(container.getOwnBindings()).toContainEqual(binding);
  });

  it("should call factory once and cache the value by default", () => {
    const container: Container = new Container();
    const value: AnyObject = { c: 3, d: 4 };
    const factory = jest.fn(() => value);

    const result: Container = container.bind({
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
    const factory = jest.fn((current: ContainerKernel) => `Hello, ${current.get<string>(NAME_TOKEN)}`);

    container.bind({ token: NAME_TOKEN, value: "Ada" });

    container.bind({
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

    container.bind({
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

    container.bind({
      type: BindingType.Factory,
      token: "factory-transient",
      factory: () => count++,
      scope: BindingScope.Transient,
    });

    expect(container.get("factory-transient")).toBe(0);
    expect(container.get("factory-transient")).toBe(1);
    expect(container.get("factory-transient")).toBe(2);
  });
});
