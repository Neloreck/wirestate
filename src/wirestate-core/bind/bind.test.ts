import { GenericService } from "@/fixtures/services/generic-service";

import { Container, ScopeBindingType, BindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { mockContainer } from "../test-utils/mock-container";
import { BindingDescriptor } from "../types/provision";

import { bind } from "./bind";
import { getContainerBindings } from "./bind-register";

describe("bind", () => {
  it("should bind a service class directly", () => {
    const container: Container = mockContainer();

    bind(container, GenericService);

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind a constant value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bind(container, {
      id: TOKEN,
      value: { key: "value" },
      bindingType: BindingType.ConstantValue,
    });

    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a constant value when type is undefined", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bind(container, { id: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a dynamic value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    bind(container, {
      id: TOKEN,
      value: null,
      bindingType: BindingType.DynamicValue,
      scopeBindingType: ScopeBindingType.Transient,
      factory: () => {
        callCount++;

        return { count: callCount };
      },
    });

    expect(container.get(TOKEN)).toEqual({ count: 1 });
    expect(container.get(TOKEN)).toEqual({ count: 2 });
    expect(container.get(TOKEN)).toEqual({ count: 3 });
  });

  it("should fall back to value for dynamic binding without factory", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic-fallback");

    bind(container, {
      id: TOKEN,
      value: Math.random(),
      bindingType: BindingType.DynamicValue,
    });

    const first: number = container.get(TOKEN);
    const second: number = container.get(TOKEN);

    expect(typeof first).toBe("number");
    expect(typeof second).toBe("number");
    expect(first).toBe(second);
  });

  it("should bind an instance descriptor", () => {
    const container: Container = mockContainer();

    bind(container, {
      bindingType: BindingType.Instance,
      id: GenericService,
      value: GenericService,
    });

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind an instance descriptor to its descriptor id", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("generic-service");
    const binding: BindingDescriptor = {
      bindingType: BindingType.Instance,
      id: TOKEN,
      value: GenericService,
    };

    bind(container, binding);

    expect(container.isBound(TOKEN)).toBe(true);
    expect(container.get(TOKEN)).toBeInstanceOf(GenericService);
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw for unknown bindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        // @ts-ignore
        bindingType: "UNKNOWN",
        id: GenericService,
        value: GenericService,
      })
    ).toThrow("Binding descriptor has unknown binding type 'UNKNOWN'.");
  });

  it("should throw for unsupported bindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        bindingType: BindingType.Factory,
        id: "factory-binding",
        value: () => "factory-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bind(container, {
        bindingType: BindingType.Factory,
        id: "factory-binding",
        value: () => "factory-value",
      })
    ).toThrow("Unsupported binding type 'Factory'. Supported binding types: ConstantValue, DynamicValue, Instance.");
  });

  it("should throw for missing descriptor id", () => {
    const container: Container = mockContainer();
    const binding = { value: "my-value" } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor must provide an 'id' token.");
  });

  it("should throw for unknown scopeBindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bind(container, {
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      })
    ).toThrow("Binding descriptor has unknown scope binding type 'UNKNOWN'.");
  });

  it("should throw for descriptors without value or factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        // @ts-ignore
        id: "missing-value",
      })
    ).toThrow("Constant value descriptor must provide a 'value' property.");

    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        id: "missing-dynamic",
      })
    ).toThrow("Dynamic value descriptor must provide either a 'factory' or 'value' property.");
  });

  it("should throw for dynamic descriptor with invalid factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw for instance descriptor without constructor value", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        bindingType: BindingType.Instance,
        id: GenericService,
        value: "not-a-constructor",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bind(container, {
        bindingType: BindingType.Instance,
        id: GenericService,
        value: "not-a-constructor",
      })
    ).toThrow("Instance descriptor 'value' must be a service constructor.");
  });
});
