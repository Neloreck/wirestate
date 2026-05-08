import { ACTIVATED_HANDLER_METADATA } from "@/wirestate/registry";
import { OnActivated } from "@/wirestate/service/on-activated";

describe("OnActivated", () => {
  it("should register metadata for generic service classes", () => {
    class MyService {
      @OnActivated()
      public onActivated(): void {}
    }

    expect(ACTIVATED_HANDLER_METADATA.get(MyService)).toContain("onActivated");
  });
});
