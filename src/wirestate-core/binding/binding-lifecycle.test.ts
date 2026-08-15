import { type BindingDescriptor, BindingScope, BindingType } from "./binding";
import { getBindingScope, getBindingType } from "./binding-lifecycle";

describe("getBindingType", () => {
  it("should report a bare class as an instance binding", () => {
    class Service {}

    expect(getBindingType(Service)).toBe(BindingType.Instance);
  });

  it("should return the declared type of a descriptor", () => {
    class Service {}

    expect(getBindingType({ token: "token", type: BindingType.Value, value: 1 })).toBe(BindingType.Value);
    expect(getBindingType({ token: Service, type: BindingType.Instance, value: Service })).toBe(BindingType.Instance);
    expect(getBindingType({ token: "token", type: BindingType.Factory, factory: () => 1 })).toBe(BindingType.Factory);
  });

  it("should prefer the declared type over the descriptor shape", () => {
    const binding = { token: "token", type: BindingType.Value, factory: () => 1 } as unknown as BindingDescriptor;

    expect(getBindingType(binding)).toBe(BindingType.Value);
  });

  it("should infer a factory binding from a factory field", () => {
    expect(getBindingType({ token: "token", factory: () => 1 })).toBe(BindingType.Factory);
    expect(getBindingType({ token: "token", type: undefined, factory: () => 1 })).toBe(BindingType.Factory);
  });

  it("should infer a value binding from any other shape", () => {
    expect(getBindingType({ token: "token", value: 1 })).toBe(BindingType.Value);
    expect(getBindingType({ token: "token", type: undefined, value: undefined })).toBe(BindingType.Value);
    expect(getBindingType({ token: "token" } as unknown as BindingDescriptor)).toBe(BindingType.Value);
  });
});

describe("getBindingScope", () => {
  it("should report a bare class as a singleton", () => {
    class Service {}

    expect(getBindingScope(Service)).toBe(BindingScope.Singleton);
  });

  it("should return the declared scope of a factory or instance descriptor", () => {
    class Service {}

    expect(
      getBindingScope({ token: "token", type: BindingType.Factory, scope: BindingScope.Transient, factory: () => 1 })
    ).toBe(BindingScope.Transient);
    expect(
      getBindingScope({ token: Service, type: BindingType.Instance, scope: BindingScope.Transient, value: Service })
    ).toBe(BindingScope.Transient);
  });

  it("should default a factory or instance descriptor to singleton", () => {
    class Service {}

    expect(getBindingScope({ token: "token", factory: () => 1 })).toBe(BindingScope.Singleton);
    expect(getBindingScope({ token: Service, type: BindingType.Instance, value: Service })).toBe(
      BindingScope.Singleton
    );
    expect(getBindingScope({ token: "token", type: BindingType.Factory, scope: undefined, factory: () => 1 })).toBe(
      BindingScope.Singleton
    );
  });

  it("should report a value descriptor as singleton", () => {
    const binding = { token: "token", scope: BindingScope.Transient, value: 1 } as unknown as BindingDescriptor;

    expect(getBindingScope({ token: "token", value: 1 })).toBe(BindingScope.Singleton);
    // Value bindings do not support transient scope, so a stray `scope` field is ignored.
    expect(getBindingScope(binding)).toBe(BindingScope.Singleton);
  });
});
