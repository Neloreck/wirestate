import { BindingType, Container } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { BindingDescriptor } from "../types/provision";

import { bindFactory } from "./bind-factory";
import { getContainerBindings } from "./bind-register";

describe("bindFactory", () => {
  it("should bind a factory creator", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("greeting-factory");
    const binding: BindingDescriptor<() => string> = {
      bindingType: BindingType.Factory,
      factory: () => () => "hello",
      id: TOKEN,
    };

    const result: Container = bindFactory(container, binding);

    const factory: () => string = container.get(TOKEN);

    expect(result).toBe(container);
    expect(factory()).toBe("hello");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw if id is missing", () => {
    const container: Container = new Container();
    const binding = { bindingType: BindingType.Factory, factory: () => () => "value" } as unknown as BindingDescriptor;

    expect(() => bindFactory(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindFactory(container, binding)).toThrow("Binding descriptor must provide an 'id' token.");
  });

  it("should throw if factory is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        bindingType: BindingType.Factory,
        id: "factory-binding",
      } as BindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        bindingType: BindingType.Factory,
        id: "factory-binding",
      } as BindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindFactory(container, {
        bindingType: BindingType.DynamicValue,
        factory: () => () => "value",
        id: "factory-binding",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindFactory(container, {
        bindingType: BindingType.DynamicValue,
        factory: () => () => "value",
        id: "factory-binding",
      })
    ).toThrow("bindFactory expected binding type 'Factory'.");
  });
});
