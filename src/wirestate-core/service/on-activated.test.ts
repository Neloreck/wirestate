import { ACTIVATED_HANDLER_METADATA } from "../registry";

import { OnActivated } from "./on-activated";

describe("OnActivated", () => {
  it("should register metadata for generic service classes", () => {
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
    }).toThrow("Only one @OnActivated method can be declared on service 'MyService'.");
  });
});
