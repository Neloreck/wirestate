import { Container } from "../alias";
import { BindingType, ScopeBindingType } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { BindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";

describe("bindConstant", () => {
  it("should bind a constant value to the container", () => {
    const container: Container = new Container();
    const binding: BindingDescriptor = { id: "my-token", value: "my-value" };

    bindConstant(container, binding);

    expect(container.get("my-token")).toBe("my-value");
  });

  it("should throw if scopeBindingType is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Singleton,
      })
    ).not.toThrow();
    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Request,
      })
    ).toThrow("Provided unexpected binding scope for constant value.");
    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Transient,
      })
    ).toThrow("Provided unexpected binding scope for constant value.");
  });

  it("should throw if id is missing", () => {
    const container: Container = new Container();
    const binding = { value: "my-value" } as unknown as BindingDescriptor;

    expect(() => bindConstant(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindConstant(container, binding)).toThrow("Binding descriptor must provide an 'id' token.");
  });

  it("should throw if value is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        id: "my-token",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        id: "my-token",
      })
    ).toThrow("Constant value descriptor must provide a 'value' property.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        bindingType: BindingType.DynamicValue,
        id: "my-token",
        value: "my-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        bindingType: BindingType.DynamicValue,
        id: "my-token",
        value: "my-value",
      })
    ).toThrow("bindConstant expected binding type 'ConstantValue'.");
  });
});
