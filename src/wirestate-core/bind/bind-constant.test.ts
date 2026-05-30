import { Container } from "../alias";
import { BindingType, BindingScope } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { ConstantValueBindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { getContainerBindings } from "./register-binding";

describe("bindConstant", () => {
  it("should bind a constant value to the container", () => {
    const container: Container = new Container();
    const binding: ConstantValueBindingDescriptor = { token: "my-token", value: "my-value" };

    const result: Container = bindConstant(container, binding);

    expect(result).toBe(container);
    expect(container.get("my-token")).toBe("my-value");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw if scope is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scope: BindingScope.Singleton,
      })
    ).not.toThrow();
    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scope: BindingScope.Request,
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow("Provided unexpected binding scope for constant value.");
    expect(() =>
      bindConstant(container, {
        token: "my-token",
        value: "my-value",
        scope: BindingScope.Transient,
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

  it("should throw if descriptor uses another type", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        type: BindingType.DynamicValue,
        token: "my-token",
        value: "my-value",
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        type: BindingType.DynamicValue,
        token: "my-token",
        value: "my-value",
      } as unknown as ConstantValueBindingDescriptor)
    ).toThrow("bindConstant expected type 'ConstantValue'.");
  });
});
