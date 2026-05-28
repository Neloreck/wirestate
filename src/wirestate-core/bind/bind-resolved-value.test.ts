import { BindingType, Container, ScopeBindingType, type ServiceIdentifier } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { BindingDescriptor } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindResolvedValue } from "./bind-resolved-value";
import { getContainerBindings } from "./register-binding";

describe("bindResolvedValue", () => {
  it("should bind a resolved value without injected arguments", () => {
    const container: Container = new Container();
    const binding: BindingDescriptor<string> = {
      bindingType: BindingType.ResolvedValue,
      factory: () => "resolved",
      id: "resolved-value",
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
    const binding: BindingDescriptor<string, unknown, [string]> = {
      bindingType: BindingType.ResolvedValue,
      factory: (name: string) => `Hello, ${name}`,
      id: GREETING_TOKEN,
      injectOptions: [NAME_TOKEN as ServiceIdentifier<string>],
    };

    bindConstant(container, { id: NAME_TOKEN, value: "Ada" });
    bindResolvedValue(container, binding as unknown as BindingDescriptor<string>);

    expect(container.get(GREETING_TOKEN)).toBe("Hello, Ada");
  });

  it("should respect Singleton scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindResolvedValue(container, {
      bindingType: BindingType.ResolvedValue,
      factory: () => count++,
      id: "singleton-resolved-value",
      scopeBindingType: ScopeBindingType.Singleton,
    });

    expect(container.get("singleton-resolved-value")).toBe(0);
    expect(container.get("singleton-resolved-value")).toBe(0);
  });

  it("should respect Transient scope", () => {
    const container: Container = new Container();
    let count: number = 0;

    bindResolvedValue(container, {
      bindingType: BindingType.ResolvedValue,
      factory: () => count++,
      id: "transient-resolved-value",
      scopeBindingType: ScopeBindingType.Transient,
    });

    expect(container.get("transient-resolved-value")).toBe(0);
    expect(container.get("transient-resolved-value")).toBe(1);
  });

  it("should throw if id is missing", () => {
    const container: Container = new Container();
    const binding = { bindingType: BindingType.ResolvedValue, factory: () => "value" } as unknown as BindingDescriptor;

    expect(() => bindResolvedValue(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindResolvedValue(container, binding)).toThrow("Binding descriptor must provide an 'id' token.");
  });

  it("should throw if factory is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.ResolvedValue,
        id: "resolved-value-binding",
      } as BindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.ResolvedValue,
        id: "resolved-value-binding",
      } as BindingDescriptor)
    ).toThrow("Resolved value descriptor 'factory' must be a function.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.DynamicValue,
        factory: () => "value",
        id: "resolved-value-binding",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.DynamicValue,
        factory: () => "value",
        id: "resolved-value-binding",
      })
    ).toThrow("bindResolvedValue expected binding type 'ResolvedValue'.");
  });

  it("should throw if scopeBindingType is not in allowed list", () => {
    const container: Container = new Container();

    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.ResolvedValue,
        factory: () => "value",
        id: "bad-scope",
        scopeBindingType: "UNKNOWN" as BindingDescriptor["scopeBindingType"],
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bindResolvedValue(container, {
        bindingType: BindingType.ResolvedValue,
        factory: () => "value",
        id: "bad-scope",
        scopeBindingType: "UNKNOWN" as BindingDescriptor["scopeBindingType"],
      })
    ).toThrow("Binding descriptor has unknown scope binding type 'UNKNOWN'.");
  });
});
