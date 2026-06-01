import { BindingType, Container } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
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

  it("should throw if descriptor uses another type", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        type: BindingType.DynamicValue,
        factory: () => () => "value",
        token: "factory-binding",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        type: BindingType.DynamicValue,
        factory: () => () => "value",
        token: "factory-binding",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("bindFactory expected type 'Factory'.");
  });
});
