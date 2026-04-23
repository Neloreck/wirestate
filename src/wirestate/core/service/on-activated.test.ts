import { WirestateError } from "@/wirestate";
import { ERROR_CODE_NOT_ABSTRACT_SERVICE } from "@/wirestate/core/error/error-code";
import { ACTIVATED_HANDLER_METADATA } from "@/wirestate/core/registry";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { OnActivated } from "@/wirestate/core/service/on-activated";

describe("OnActivated", () => {
  it("should register metadata for AbstractService subclass", () => {
    class MyService extends AbstractService {
      @OnActivated()
      public onActivated(): void {}
    }

    expect(ACTIVATED_HANDLER_METADATA.get(MyService)).toContain("onActivated");
  });

  it("should throw for non-AbstractService class", () => {
    expect(() => {
      class NotAService {
        @OnActivated()
        public onActivated(): void {}
      }

      return NotAService;
    }).toThrow(
      new WirestateError(
        ERROR_CODE_NOT_ABSTRACT_SERVICE,
        "@OnActivated: can only be applied to methods of AbstractService subclasses. " +
          "'onActivated' was applied to an incompatible class."
      )
    );
  });
});
