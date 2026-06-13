import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType } from "../binding/binding";

import { getBindingToken, InjectionToken, tokenToString } from "./binding-tokens";

describe("tokenToString", () => {
  it("should return the function name if the token is a class", () => {
    expect(tokenToString(GenericService)).toBe("GenericService");
  });

  it("should return an empty string if the token is an anonymous function", () => {
    expect(tokenToString(class {})).toBe("");
  });

  it("should return the symbol description if the token is a symbol", () => {
    expect(tokenToString(Symbol("test-symbol"))).toBe("test-symbol");
  });

  it("should return the stringified symbol if the symbol has no description", () => {
    expect(tokenToString(Symbol())).toBe("Symbol()");
  });

  it("should return the injection token string representation if the token is an injection token", () => {
    expect(tokenToString(new InjectionToken<string>("test-token"))).toBe('InjectionToken "test-token"');
  });

  it("should return the injection token string representation for a symbol-described injection token", () => {
    expect(tokenToString(new InjectionToken<string>(Symbol("symbol-token")))).toBe(
      'InjectionToken "Symbol(symbol-token)"'
    );
  });

  it("should return the token itself if the token is a string", () => {
    expect(tokenToString("test-string")).toBe("test-string");
  });
});

describe("getBindingToken", () => {
  it("should return the function itself if the binding is a function", () => {
    expect(getBindingToken(GenericService)).toBe(GenericService);
  });

  it("should return the token if the binding is a descriptor with value", () => {
    expect(getBindingToken({ token: "test-value", value: { a: 1 } })).toBe("test-value");
  });

  it("should return the token if the binding is a descriptor with factory", () => {
    expect(getBindingToken({ type: BindingType.Factory, token: "test-factory", factory: () => "test" })).toBe(
      "test-factory"
    );
  });

  it("should return the symbol token if the binding is a descriptor with symbol token", () => {
    const token: unique symbol = Symbol("token");

    expect(getBindingToken({ token, value: GenericService })).toBe(token);
  });
});
