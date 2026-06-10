import { Container } from "../alias";
import { BindingType, BindingScope } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { ValueBindingDescriptor } from "../types/provision";

import { bindValue } from "./bind-value";
import { getContainerBindings } from "./utils/register-binding";

describe("bindValue", () => {
  it("should bind a value to the container", () => {
    const container: Container = new Container();
    const binding: ValueBindingDescriptor = { token: "my-token", value: "my-value" };

    const result: Container = bindValue(container, binding);

    expect(result).toBe(container);
    expect(container.get("my-token")).toBe("my-value");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw if scope is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindValue(container, {
        token: "my-token",
        value: "my-value",
        scope: BindingScope.Singleton,
      })
    ).not.toThrow();
    expect(() =>
      bindValue(container, {
        token: "my-token",
        value: "my-value",
        scope: "Request",
      } as unknown as ValueBindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope 'Request'.");
    expect(() =>
      bindValue(container, {
        token: "my-token",
        value: "my-value",
        scope: BindingScope.Transient,
      } as unknown as ValueBindingDescriptor)
    ).toThrow("Provided unexpected binding scope for value.");
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = { value: "my-value" } as unknown as ValueBindingDescriptor;

    expect(() => bindValue(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindValue(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if value is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindValue(container, {
        token: "my-token",
      } as ValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindValue(container, {
        token: "my-token",
      } as ValueBindingDescriptor)
    ).toThrow("Value descriptor must provide a 'value' property.");
  });

  it("should throw if descriptor uses another type", () => {
    const container: Container = new Container();

    expect(() =>
      bindValue(container, {
        type: BindingType.Factory,
        token: "my-token",
        value: "my-value",
      } as unknown as ValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindValue(container, {
        type: BindingType.Factory,
        token: "my-token",
        value: "my-value",
      } as unknown as ValueBindingDescriptor)
    ).toThrow("bindValue expected type 'Value'.");
  });
});
