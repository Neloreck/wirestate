import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType, Container, ScopeBindingType } from "../alias";
import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { mockContainer } from "../test-utils/mock-container";
import { BindingDescriptor, DynamicValueBindingDescriptor, InstanceBindingDescriptor } from "../types/provision";

import { bind } from "./bind";
import { getContainerBindings } from "./register-binding";

describe("bind", () => {
  it("should bind a service class directly", () => {
    const container: Container = mockContainer();
    const result: Container = bind(container, GenericService);

    expect(result).toBe(container);
    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind a constant value descriptor", () => {
    const TOKEN: unique symbol = Symbol("config");

    const container: Container = mockContainer();
    const result: Container = bind(container, {
      token: TOKEN,
      value: { key: "value" },
      bindingType: BindingType.ConstantValue,
    });

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a constant value when type is undefined", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bind(container, { token: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a dynamic value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    bind(container, {
      token: TOKEN,
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

  it("should bind an instance descriptor", () => {
    const container: Container = mockContainer();

    bind(container, {
      bindingType: BindingType.Instance,
      token: GenericService,
      value: GenericService,
    });

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind an instance descriptor to its descriptor token", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("generic-service");
    const binding: BindingDescriptor = {
      bindingType: BindingType.Instance,
      token: TOKEN,
      value: GenericService,
    };

    bind(container, binding);

    expect(container.isBound(TOKEN)).toBe(true);
    expect(container.get(TOKEN)).toBeInstanceOf(GenericService);
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw for instance descriptor without token", () => {
    const container: Container = mockContainer();
    const binding = {
      bindingType: BindingType.Instance,
      value: GenericService,
    } as unknown as InstanceBindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw for instance descriptor with unknown scopeBindingType", () => {
    const container: Container = mockContainer();
    const binding = {
      bindingType: BindingType.Instance,
      token: GenericService,
      scopeBindingType: "UNKNOWN",
      value: GenericService,
    } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor has unknown scope binding type 'UNKNOWN'.");
  });

  it("should throw for unknown bindingType", () => {
    const container: Container = mockContainer();
    const binding = {
      bindingType: "UNKNOWN",
      token: GenericService,
      value: GenericService,
    } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor has unknown binding type 'UNKNOWN'.");
  });

  it("should throw for missing descriptor token", () => {
    const container: Container = mockContainer();
    const binding = { value: "my-value" } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw for unknown scopeBindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        token: "bad-scope",
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      } as unknown as BindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bind(container, {
        token: "bad-scope",
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      } as unknown as BindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope binding type 'UNKNOWN'.");
  });

  it("should throw for descriptors without value or factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        token: "missing-value",
      } as BindingDescriptor)
    ).toThrow("Constant value descriptor must provide a 'value' property.");

    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        token: "missing-dynamic",
      } as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw for dynamic descriptor with invalid factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bind(container, {
        bindingType: BindingType.DynamicValue,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });
});
