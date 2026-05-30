import { BindingType, Injectable } from "../alias";

import { validateContainerConfig } from "./validate-container-config";

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
    const TOKEN: unique symbol = Symbol("test-service");

    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        activate: true,
        bindings: [
          {
            bindingType: BindingType.Instance,
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

  it("should throw if activated service is not in bindings", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        activate: ["OtherService"],
        bindings: [TestService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");
  });
});
