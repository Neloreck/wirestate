import { BindingType, Injectable } from "../alias";

import { validateContainerConfig } from "./validate-container-config";

describe("validateContainerConfig", () => {
  it("should validate container config without creating a container", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        entries: [TestService],
        activate: [TestService],
      })
    ).not.toThrow();
  });

  it("should validate activate true against descriptor entries", () => {
    const TOKEN: unique symbol = Symbol("test-service");

    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        entries: [
          {
            bindingType: BindingType.Instance,
            id: TOKEN,
            value: TestService,
          },
        ],
        activate: true,
      })
    ).not.toThrow();
  });

  it("should throw if activate is provided without entries", () => {
    expect(() =>
      validateContainerConfig({
        activate: ["SomeService"],
      })
    ).toThrow("Supplied activation list while entries for binding are not provided.");
  });

  it("should throw if activated service is not in entries", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      validateContainerConfig({
        entries: [TestService],
        activate: ["OtherService"],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");
  });
});
