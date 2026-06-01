import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType, Container, BindingScope } from "../alias";
import { createContainer } from "../container/create-container";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { BindingDescriptor, DynamicValueBindingDescriptor, InstanceBindingDescriptor } from "../types/provision";

import { bind } from "./bind";
import { getContainerBindings } from "./utils/register-binding";

describe("bind", () => {
  it("should bind a service class directly", () => {
    const container: Container = createContainer();
    const result: Container = bind(container, GenericService);

    expect(result).toBe(container);
    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind a constant value descriptor", () => {
    const TOKEN: unique symbol = Symbol("config");

    const container: Container = createContainer();
    const result: Container = bind(container, {
      token: TOKEN,
      value: { key: "value" },
      type: BindingType.ConstantValue,
    });

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a constant value when type is undefined", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("config");

    bind(container, { token: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a dynamic value descriptor", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    bind(container, {
      token: TOKEN,
      type: BindingType.DynamicValue,
      scope: BindingScope.Transient,
      factory: () => {
        callCount++;

        return { count: callCount };
      },
    });

    expect(container.get(TOKEN)).toEqual({ count: 1 });
    expect(container.get(TOKEN)).toEqual({ count: 2 });
    expect(container.get(TOKEN)).toEqual({ count: 3 });
  });

  it("should bind descriptors with string literal type and scope", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("literal-dynamic");

    const descriptor: DynamicValueBindingDescriptor = {
      token: TOKEN,
      type: "DynamicValue",
      scope: "Singleton",
      factory: () => ({ value: "created" }),
    };

    bind(container, descriptor);

    const first = container.get(TOKEN);

    expect(first).toEqual({ value: "created" });
    expect(container.get(TOKEN)).toBe(first);
  });

  it("should bind an instance descriptor", () => {
    const container: Container = createContainer();

    bind(container, {
      type: BindingType.Instance,
      token: GenericService,
      value: GenericService,
    });

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind an instance descriptor to its descriptor token", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("generic-service");
    const binding: BindingDescriptor = {
      type: BindingType.Instance,
      token: TOKEN,
      value: GenericService,
    };

    bind(container, binding);

    expect(container.isBound(TOKEN)).toBe(true);
    expect(container.get(TOKEN)).toBeInstanceOf(GenericService);
    expect(getContainerBindings(container)).toEqual([binding]);
  });

  it("should throw for instance descriptor without token", () => {
    const container: Container = createContainer();
    const binding = {
      type: BindingType.Instance,
      value: GenericService,
    } as unknown as InstanceBindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw for instance descriptor with unknown scope", () => {
    const container: Container = createContainer();
    const binding = {
      type: BindingType.Instance,
      token: GenericService,
      scope: "UNKNOWN",
      value: GenericService,
    } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
  });

  it("should throw for unknown type", () => {
    const container: Container = createContainer();
    const binding = {
      type: "UNKNOWN",
      token: GenericService,
      value: GenericService,
    } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor has unknown type 'UNKNOWN'.");
  });

  it("should throw for missing descriptor token", () => {
    const container: Container = createContainer();
    const binding = { value: "my-value" } as unknown as BindingDescriptor;

    expect(() => bind(container, binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() => bind(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw for unknown scope", () => {
    const container: Container = createContainer();

    expect(() =>
      bind(container, {
        token: "bad-scope",
        scope: "UNKNOWN",
        value: "my-value",
      } as unknown as BindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
    expect(() =>
      bind(container, {
        token: "bad-scope",
        scope: "UNKNOWN",
        value: "my-value",
      } as unknown as BindingDescriptor)
    ).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
  });

  it("should throw for descriptors without value or factory", () => {
    const container: Container = createContainer();

    expect(() =>
      bind(container, {
        token: "missing-value",
      } as BindingDescriptor)
    ).toThrow("Constant value descriptor must provide a 'value' property.");

    expect(() =>
      bind(container, {
        type: BindingType.DynamicValue,
        token: "missing-dynamic",
      } as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw for dynamic descriptor with invalid factory", () => {
    const container: Container = createContainer();

    expect(() =>
      bind(container, {
        type: BindingType.DynamicValue,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bind(container, {
        type: BindingType.DynamicValue,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as DynamicValueBindingDescriptor)
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });
});
