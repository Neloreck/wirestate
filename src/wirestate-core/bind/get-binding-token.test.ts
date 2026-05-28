import { GenericService } from "@/fixtures/services/generic-service";

import { getBindingToken } from "./get-binding-token";

describe("getBindingToken", () => {
  it("should return the function itself if the binding is a function", () => {
    expect(getBindingToken(GenericService)).toBe(GenericService);
  });

  it("should return the id if the binding is a descriptor with value", () => {
    expect(getBindingToken({ id: "test-value", value: { a: 1 } })).toBe("test-value");
  });

  it("should return the id if the binding is a descriptor with factory", () => {
    expect(getBindingToken({ id: "test-factory", factory: () => "test" })).toBe("test-factory");
  });

  it("should return the symbol id if the binding is a descriptor with symbol id", () => {
    const id: unique symbol = Symbol("my-service");

    expect(getBindingToken({ id, value: GenericService })).toBe(id);
  });
});
