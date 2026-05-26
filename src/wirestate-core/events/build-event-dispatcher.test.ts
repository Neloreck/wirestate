import { buildEventDispatcher } from "./build-event-dispatcher";
import { OnEvent } from "./on-event";

describe("buildEventDispatcher", () => {
  it("should isolate errors between decorated handlers on the same service", () => {
    const error = new Error("first handler failed");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    class TestService {
      public readonly calls: Array<string> = [];

      @OnEvent("TEST")
      public first(): void {
        this.calls.push("first");
        throw error;
      }

      @OnEvent("TEST")
      public second(): void {
        this.calls.push("second");
      }

      @OnEvent("OTHER")
      public other(): void {
        this.calls.push("other");
      }
    }

    const service = new TestService();
    const dispatcher = buildEventDispatcher(service);

    if (!dispatcher) {
      throw new Error("Expected dispatcher to be created.");
    }

    dispatcher({ type: "TEST" });

    expect(service.calls).toEqual(["first", "second"]);
    expect(errorSpy).toHaveBeenCalledWith("[wirestate] Event handler threw:", error);

    errorSpy.mockRestore();
  });
});
