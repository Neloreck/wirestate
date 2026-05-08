import { DEACTIVATION_HANDLER_METADATA } from "@/wirestate/registry";
import { OnDeactivation } from "@/wirestate/service/on-deactivation";

describe("OnDeactivation", () => {
  it("should register metadata for generic class", () => {
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {}
    }

    expect(DEACTIVATION_HANDLER_METADATA.get(MyService)).toContain("onDeactivation");
  });
});
