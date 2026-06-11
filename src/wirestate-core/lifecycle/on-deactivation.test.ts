import { DEACTIVATION_HANDLER_METADATA } from "../metadata/registry";

import { getDeactivationHandlerMetadata, OnDeactivation } from "./on-deactivation";

describe("OnDeactivation", () => {
  it("should register metadata for generic class", () => {
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {}
    }

    expect(DEACTIVATION_HANDLER_METADATA.get(MyService)).toBe("onDeactivation");
  });

  it("should reject multiple deactivation handlers on the same class", () => {
    expect(() => {
      class MyService {
        @OnDeactivation()
        public first(): void {}

        @OnDeactivation()
        public second(): void {}
      }

      return MyService;
    }).toThrow("Only one @OnDeactivation method can be declared on 'MyService'.");
  });

  it("should allow redecorating the same deactivation method across a hierarchy", () => {
    class BaseService {
      @OnDeactivation()
      public onDeactivation(): void {}
    }

    class ChildService extends BaseService {
      @OnDeactivation()
      public override onDeactivation(): void {}
    }

    expect(getDeactivationHandlerMetadata(new ChildService())).toBe("onDeactivation");
  });

  it("should reject different deactivation handlers across a hierarchy", () => {
    class BaseService {
      @OnDeactivation()
      public first(): void {}
    }

    class ChildService extends BaseService {
      @OnDeactivation()
      public second(): void {}
    }

    expect(() => getDeactivationHandlerMetadata(new ChildService())).toThrow(
      "Only one @OnDeactivation method can be declared across class hierarchy for 'ChildService'."
    );
  });
});
