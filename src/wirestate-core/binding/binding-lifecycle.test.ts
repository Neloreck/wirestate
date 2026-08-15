import { type BindingDescriptor, BindingType } from "./binding";
import { getBindingType } from "./binding-lifecycle";

describe("getBindingType", () => {
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
