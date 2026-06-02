import { getProvisionHandlerMetadata, OnProvision } from "./on-provision";

describe("onProvision and getProvisionHandlerMetadata", () => {
  it("should store provision handler metadata", () => {
    class TestProvider {
      @OnProvision()
      public provision(): void {}
    }

    expect(getProvisionHandlerMetadata(new TestProvider())).toBe("provision");
  });

  it("should return null when no provision handler exists", () => {
    class TestProvider {}

    expect(getProvisionHandlerMetadata(new TestProvider())).toBeNull();
  });

  it("should reject multiple provision handlers on the same class", () => {
    expect(() => {
      class TestProvider {
        @OnProvision()
        public first(): void {}

        @OnProvision()
        public second(): void {}
      }

      return TestProvider;
    }).toThrow("Only one @OnProvision method can be declared on provider 'TestProvider'.");
  });

  it("should inherit provision handler metadata", () => {
    class BaseProvider {
      @OnProvision()
      public provision(): void {}
    }

    class ChildProvider extends BaseProvider {}

    expect(getProvisionHandlerMetadata(new ChildProvider())).toBe("provision");
  });

  it("should allow redecorating the same provision method across a hierarchy", () => {
    class BaseProvider {
      @OnProvision()
      public provision(): void {}
    }

    class ChildProvider extends BaseProvider {
      @OnProvision()
      public override provision(): void {}
    }

    expect(getProvisionHandlerMetadata(new ChildProvider())).toBe("provision");
  });

  it("should reject different provision handlers across a hierarchy", () => {
    class BaseProvider {
      @OnProvision()
      public first(): void {}
    }

    class ChildProvider extends BaseProvider {
      @OnProvision()
      public second(): void {}
    }

    expect(() => getProvisionHandlerMetadata(new ChildProvider())).toThrow(
      "Only one @OnProvision method can be declared across provider hierarchy 'ChildProvider'."
    );
  });

  it("should store symbol provision handler metadata", () => {
    const provision: unique symbol = Symbol("provision");

    class TestProvider {
      public [provision](): void {}
    }

    OnProvision()(
      TestProvider.prototype,
      provision,
      Object.getOwnPropertyDescriptor(TestProvider.prototype, provision)!
    );

    expect(getProvisionHandlerMetadata(new TestProvider())).toBe(provision);
  });
});
