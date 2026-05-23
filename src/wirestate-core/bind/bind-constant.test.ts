import { bindingTypeValues, Container } from "inversify";

import { ScopeBindingType } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { InjectableDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";

describe("bindConstant", () => {
  it("should bind a constant value to the container", () => {
    const container: Container = new Container();
    const entry: InjectableDescriptor = { id: "my-token", value: "my-value" };

    bindConstant(container, entry);

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
    const entry = { value: "my-value" } as unknown as InjectableDescriptor;

    expect(() => bindConstant(container, entry)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindConstant(container, entry)).toThrow("Injectable descriptor must provide an 'id' token.");
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
        bindingType: bindingTypeValues.DynamicValue,
        id: "my-token",
        value: "my-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindConstant(container, {
        bindingType: bindingTypeValues.DynamicValue,
        id: "my-token",
        value: "my-value",
      })
    ).toThrow("bindConstant expected binding type 'ConstantValue'.");
  });
});
