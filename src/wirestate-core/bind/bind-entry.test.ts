import { bindingScopeValues, bindingTypeValues, Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { ERROR_CODE_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { mockContainer } from "../test-utils/mock-container";
import { InjectableDescriptor } from "../types/provision";

import { bindEntry } from "./bind-entry";

describe("bindEntry", () => {
  it("should bind a service class directly", () => {
    const container: Container = mockContainer();

    bindEntry(container, GenericService);

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind a constant value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bindEntry(container, {
      id: TOKEN,
      value: { key: "value" },
      bindingType: bindingTypeValues.ConstantValue,
    });

    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a constant value when type is undefined", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("config");

    bindEntry(container, { id: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a dynamic value descriptor", () => {
    const container: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    bindEntry(container, {
      id: TOKEN,
      value: null,
      bindingType: bindingTypeValues.DynamicValue,
      scopeBindingType: bindingScopeValues.Transient,
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

    bindEntry(container, {
      id: TOKEN,
      value: Math.random(),
      bindingType: bindingTypeValues.DynamicValue,
    });

    const first: number = container.get(TOKEN);
    const second: number = container.get(TOKEN);

    expect(typeof first).toBe("number");
    expect(typeof second).toBe("number");
    expect(first).toBe(second);
  });

  it("should bind an instance descriptor", () => {
    const container: Container = mockContainer();

    bindEntry(container, {
      bindingType: bindingTypeValues.Instance,
      id: GenericService,
      value: GenericService,
    });

    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should throw for unknown bindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        // @ts-ignore
        bindingType: "UNKNOWN",
        id: GenericService,
        value: GenericService,
      })
    ).toThrow("Injectable descriptor has unknown binding type 'UNKNOWN'.");
  });

  it("should throw for unsupported bindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.Factory,
        id: "factory-entry",
        value: () => "factory-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.Factory,
        id: "factory-entry",
        value: () => "factory-value",
      })
    ).toThrow("Unsupported binding type 'Factory'. Supported binding types: ConstantValue, DynamicValue, Instance.");
  });

  it("should throw for missing descriptor id", () => {
    const container: Container = mockContainer();
    const entry = { value: "my-value" } as unknown as InjectableDescriptor;

    expect(() => bindEntry(container, entry)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindEntry(container, entry)).toThrow("Injectable descriptor must provide an 'id' token.");
  });

  it("should throw for unknown scopeBindingType", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_BINDING_SCOPE }));
    expect(() =>
      bindEntry(container, {
        id: "bad-scope",
        // @ts-ignore
        scopeBindingType: "UNKNOWN",
        value: "my-value",
      })
    ).toThrow("Injectable descriptor has unknown scope binding type 'UNKNOWN'.");
  });

  it("should throw for descriptors without value or factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        // @ts-ignore
        id: "missing-value",
      })
    ).toThrow("Constant value descriptor must provide a 'value' property.");

    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.DynamicValue,
        id: "missing-dynamic",
      })
    ).toThrow("Dynamic value descriptor must provide either a 'factory' or 'value' property.");
  });

  it("should throw for dynamic descriptor with invalid factory", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.DynamicValue,
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.DynamicValue,
        // @ts-ignore
        factory: "not-a-function",
        id: "bad-factory",
      })
    ).toThrow("Dynamic value descriptor 'factory' must be a function.");
  });

  it("should throw for instance descriptor without constructor value", () => {
    const container: Container = mockContainer();

    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.Instance,
        id: GenericService,
        value: "not-a-constructor",
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindEntry(container, {
        bindingType: bindingTypeValues.Instance,
        id: GenericService,
        value: "not-a-constructor",
      })
    ).toThrow("Instance descriptor 'value' must be a service constructor.");
  });
});
