import { getActivationHandlerMetadata, OnActivation } from "./on-activation";

describe("OnActivation", () => {
  it("should register metadata for generic classes", () => {
    class MyService {
      @OnActivation()
      public onActivation(): void {}
    }

    expect(getActivationHandlerMetadata(new MyService())).toBe("onActivation");
  });

  it("should reject multiple activation handlers on the same class", () => {
    expect(() => {
      class MyService {
        @OnActivation()
        public first(): void {}

        @OnActivation()
        public second(): void {}
      }

      return MyService;
    }).toThrow("Only one @OnActivation method can be declared on 'MyService'.");
  });

  it("should allow redecorating the same activation method across a hierarchy", () => {
    class BaseService {
      @OnActivation()
      public onActivation(): void {}
    }

    class ChildService extends BaseService {
      @OnActivation()
      public override onActivation(): void {}
    }

    expect(getActivationHandlerMetadata(new ChildService())).toBe("onActivation");
  });

  it("should reject different activation handlers across a hierarchy", () => {
    class BaseService {
      @OnActivation()
      public first(): void {}
    }

    class ChildService extends BaseService {
      @OnActivation()
      public second(): void {}
    }

    expect(() => getActivationHandlerMetadata(new ChildService())).toThrow(
      "Only one @OnActivation method can be declared across class hierarchy for 'ChildService'."
    );
  });
});
