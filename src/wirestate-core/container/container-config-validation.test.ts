import { BindingType } from "../binding/binding";
import { Injectable } from "../metadata/metadata-injectable";

import { validateContainerConfig } from "./container-config-validation";

describe("validateContainerConfig", () => {
  it("should validate container config without creating a container", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        activate: [TestService],
        bindings: [TestService],
      })
    ).not.toThrow();
  });

  it("should validate activate true against descriptor bindings", () => {
    const TOKEN: unique symbol = Symbol("token");

    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        activate: true,
        bindings: [
          {
            type: BindingType.Instance,
            token: TOKEN,
            value: TestService,
          },
        ],
      })
    ).not.toThrow();
  });

  it("should throw if activate is provided without bindings", () => {
    expect(() =>
      validateContainerConfig({
        activate: ["SomeService"],
      })
    ).toThrow("Supplied activation list while container bindings are not provided.");
  });

  it("should throw if activated instance is not in bindings", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        activate: ["OtherService"],
        bindings: [TestService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");
  });

  it("should throw if onError is not a function", () => {
    expect(() =>
      validateContainerConfig({
        onError: "not-a-function",
      } as never)
    ).toThrow("Container: 'onError' must be a function.");
  });
});
