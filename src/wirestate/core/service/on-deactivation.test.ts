import { DEACTIVATION_HANDLER_METADATA } from "@/wirestate/core/registry";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";

describe("OnDeactivation", () => {
  it("should register metadata for AbstractService subclass", () => {
    class MyService extends AbstractService {
      @OnDeactivation()
      public onDeactivation(): void {}
    }

    expect(DEACTIVATION_HANDLER_METADATA.get(MyService)).toContain("onDeactivation");
  });

  it("should throw for non-AbstractService class", () => {
    expect(() => {
      class NotAService {
        @OnDeactivation()
        public onDeactivation(): void {}
      }

      return NotAService;
    }).toThrow();
  });
});
