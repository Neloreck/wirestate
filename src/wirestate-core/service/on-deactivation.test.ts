import { DEACTIVATION_HANDLER_METADATA } from "../registry";

import { OnDeactivation } from "./on-deactivation";

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
    }).toThrow("Only one @OnDeactivation method can be declared on service 'MyService'.");
  });
});
