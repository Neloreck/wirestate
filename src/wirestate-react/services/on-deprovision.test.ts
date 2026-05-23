import { getDeprovisionHandlerMetadata, OnDeprovision } from "./on-deprovision";

describe("onDeprovision and getDeprovisionHandlerMetadata", () => {
  it("should store deprovision handler metadata", () => {
    class TestProvider {
      @OnDeprovision()
      public deprovision(): void {}
    }

    expect(getDeprovisionHandlerMetadata(new TestProvider())).toBe("deprovision");
  });

  it("should return null when no deprovision handler exists", () => {
    class TestProvider {}

    expect(getDeprovisionHandlerMetadata(new TestProvider())).toBeNull();
  });

  it("should reject multiple deprovision handlers on the same class", () => {
    expect(() => {
      class TestProvider {
        @OnDeprovision()
        public first(): void {}

        @OnDeprovision()
        public second(): void {}
      }

      return TestProvider;
    }).toThrow("Only one @OnDeprovision method can be declared on provider 'TestProvider'.");
  });

  it("should inherit deprovision handler metadata", () => {
    class BaseProvider {
      @OnDeprovision()
      public deprovision(): void {}
    }

    class ChildProvider extends BaseProvider {}

    expect(getDeprovisionHandlerMetadata(new ChildProvider())).toBe("deprovision");
  });

  it("should allow redecorating the same deprovision method across a hierarchy", () => {
    class BaseProvider {
      @OnDeprovision()
      public deprovision(): void {}
    }

    class ChildProvider extends BaseProvider {
      @OnDeprovision()
      public override deprovision(): void {}
    }

    expect(getDeprovisionHandlerMetadata(new ChildProvider())).toBe("deprovision");
  });

  it("should reject different deprovision handlers across a hierarchy", () => {
    class BaseProvider {
      @OnDeprovision()
      public first(): void {}
    }

    class ChildProvider extends BaseProvider {
      @OnDeprovision()
      public second(): void {}
    }

    expect(() => getDeprovisionHandlerMetadata(new ChildProvider())).toThrow(
      "Only one @OnDeprovision method can be declared across provider hierarchy 'ChildProvider'."
    );
  });

  it("should store symbol deprovision handler metadata", () => {
    const deprovision: unique symbol = Symbol("deprovision");

    class TestProvider {
      public [deprovision](): void {}
    }

    OnDeprovision()(
      TestProvider.prototype,
      deprovision,
      Object.getOwnPropertyDescriptor(TestProvider.prototype, deprovision)!
    );

    expect(getDeprovisionHandlerMetadata(new TestProvider())).toBe(deprovision);
  });
});
