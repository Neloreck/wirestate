import { BindingType, Container, BindingScope, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { ResolvedValueBindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindResolvedValue } from "./bind-resolved-value";
import { getContainerBindings } from "./register-binding";

describe("bindResolvedValue", () => {
  it("should bind a resolved value without injected arguments", () => {
    const container: Container = new Container();
    const binding: ResolvedValueBindingDescriptor<string> = {
      type: BindingType.ResolvedValue,
      factory: () => "resolved",
      token: "resolved-value",
    };

    const result: Container = bindResolvedValue(container, binding);

    expect(result).toBe(container);
    expect(container.get("resolved-value")).toBe("resolved");
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should bind a resolved value with injected arguments", () => {
    const container: Container = new Container();
    const NAME_TOKEN: unique symbol = Symbol("name");
    const GREETING_TOKEN: unique symbol = Symbol("greeting");
    const binding: ResolvedValueBindingDescriptor<string, [string]> = {
      type: BindingType.ResolvedValue,
      factory: (name: string) => `Hello, ${name}`,
      token: GREETING_TOKEN,
      injectOptions: [NAME_TOKEN as ServiceIdentifier<string>],
    };

    bindConstant(container, { token: NAME_TOKEN, value: "Ada" });
    bindResolvedValue(container, binding);

    expect(container.get(GREETING_TOKEN)).toBe("Hello, Ada");
  });

  it("should respect Singleton scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindResolvedValue(container, {
      type: BindingType.ResolvedValue,
      factory: () => count++,
      token: "singleton-resolved-value",
      scope: BindingScope.Singleton,
    });

    expect(container.get("singleton-resolved-value")).toBe(0);
    expect(container.get("singleton-resolved-value")).toBe(0);
  });

  it("should respect Transient scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindResolvedValue(container, {
      type: BindingType.ResolvedValue,
      factory: () => count++,
      token: "transient-resolved-value",
      scope: BindingScope.Transient,
    });

    expect(container.get("transient-resolved-value")).toBe(0);
    expect(container.get("transient-resolved-value")).toBe(1);
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = {
      type: BindingType.ResolvedValue,
      factory: () => "value",
    } as unknown as ResolvedValueBindingDescriptor;

    expect(() => bindResolvedValue(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindResolvedValue(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if factory is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.ResolvedValue,
        token: "resolved-value-binding",
      } as ResolvedValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.ResolvedValue,
        token: "resolved-value-binding",
      } as ResolvedValueBindingDescriptor)
    ).toThrow("Resolved value descriptor 'factory' must be a function.");
  });

  it("should throw if descriptor uses another type", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.DynamicValue,
        factory: () => "value",
        token: "resolved-value-binding",
      } as unknown as ResolvedValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.DynamicValue,
        factory: () => "value",
        token: "resolved-value-binding",
      } as unknown as ResolvedValueBindingDescriptor)
    ).toThrow("bindResolvedValue expected type 'ResolvedValue'.");
  });

  it("should throw if scope is not in allowed list", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.ResolvedValue,
        factory: () => "value",
        token: "bad-scope",
        scope: "UNKNOWN",
      } as unknown as ResolvedValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
    expect(() =>
      bindResolvedValue(container, {
        type: BindingType.ResolvedValue,
        factory: () => "value",
        token: "bad-scope",
        scope: "UNKNOWN",
      } as unknown as ResolvedValueBindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
  });
});
