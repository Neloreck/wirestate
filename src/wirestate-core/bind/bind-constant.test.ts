import { getContainerBindings } from "@wirestate/core";

import { Container } from "../alias";
import { BindingType, ScopeBindingType } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { ConstantValueBindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";

describe("bindConstant", () => {
  it("should bind a constant value to the container", () => {
    const container: Container = new Container();
    const binding: ConstantValueBindingDescriptor = { token: "my-token", value: "my-value" };

    const result: Container = bindConstant(container, binding);

    expect(result).toBe(container);
    expect(container.get("my-token")).toBe("my-value");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw if scopeBindingType is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Singleton,
      })
    ).not.toThrow();
    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Request,
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow("Provided unexpected binding scope for constant value.");
    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Transient,
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow("Provided unexpected binding scope for constant value.");
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = { value: "my-value" } as unknown as ConstantValueBindingDescriptor;

    expect(() => bindConstant(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindConstant(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if value is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        token: "my-token",
      } as ConstantValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        token: "my-token",
      } as ConstantValueBindingDescriptor)
    ).toThrow("Constant value descriptor must provide a 'value' property.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        bindingType: BindingType.DynamicValue,
        token: "my-token",
        value: "my-value",
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        bindingType: BindingType.DynamicValue,
        token: "my-token",
        value: "my-value",
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow("bindConstant expected binding type 'ConstantValue'.");
  });
});
