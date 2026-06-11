import { ACTIVATED_HANDLER_METADATA } from "../registry";

import { getActivatedHandlerMetadata, OnActivated } from "./on-activated";

describe("OnActivated", () => {
  it("should register metadata for generic classes", () => {
    class MyService {
      @OnActivated()
      public onActivated(): void {}
    }

    expect(ACTIVATED_HANDLER_METADATA.get(MyService)).toBe("onActivated");
  });

  it("should reject multiple activation handlers on the same class", () => {
    expect(() => {
      class MyService {
        @OnActivated()
        public first(): void {}

        @OnActivated()
        public second(): void {}
      }

      return MyService;
    }).toThrow("Only one @OnActivated method can be declared on 'MyService'.");
  });

  it("should allow redecorating the same activation method across a hierarchy", () => {
    class BaseService {
      @OnActivated()
      public onActivated(): void {}
    }

    class ChildService extends BaseService {
      @OnActivated()
      public override onActivated(): void {}
    }

    expect(getActivatedHandlerMetadata(new ChildService())).toBe("onActivated");
  });

  it("should reject different activation handlers across a hierarchy", () => {
    class BaseService {
      @OnActivated()
      public first(): void {}
    }

    class ChildService extends BaseService {
      @OnActivated()
      public second(): void {}
    }

    expect(() => getActivatedHandlerMetadata(new ChildService())).toThrow(
      "Only one @OnActivated method can be declared across class hierarchy for 'ChildService'."
    );
  });
});
