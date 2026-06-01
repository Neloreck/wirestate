import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType } from "../../alias";

import { getBindingToken } from "./get-binding-token";

describe("getBindingToken", () => {
  it("should return the function itself if the binding is a function", () => {
    expect(getBindingToken(GenericService)).toBe(GenericService);
  });

  it("should return the token if the binding is a descriptor with value", () => {
    expect(getBindingToken({ token: "test-value", value: { a: 1 } })).toBe("test-value");
  });

  it("should return the token if the binding is a descriptor with factory", () => {
    expect(getBindingToken({ type: BindingType.DynamicValue, token: "test-factory", factory: () => "test" })).toBe(
      "test-factory"
    );
  });

  it("should return the symbol token if the binding is a descriptor with symbol token", () => {
    const token: unique symbol = Symbol("my-service");

    expect(getBindingToken({ token, value: GenericService })).toBe(token);
  });
});
