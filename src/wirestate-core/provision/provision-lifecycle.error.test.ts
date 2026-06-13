import { Container } from "../container/container";
import { Injectable } from "../metadata/metadata-injectable";

import { OnDeprovision } from "./on-deprovision";
import { OnProvision } from "./on-provision";
import { provisionContainer } from "./provision-lifecycle";
import { getProvisionState } from "./provision-state";

describe("provision lifecycle errors", () => {
  it("should report provider lifecycle errors to container error handler", () => {
    const error = new Error("provision-fail");
    const onError = jest.fn();

    @Injectable()
    class FailingProvisionService {
      @OnProvision()
      public onProvision(): void {
        throw error;
      }
    }

    const container: Container = new Container({
      bindings: [FailingProvisionService],
      onError,
    });

    expect(() => provisionContainer(container, [FailingProvisionService])).toThrow(error);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["FailingProvisionService", "onProvision"],
        error,
        message: "@OnProvision failed for",
        instanceName: "FailingProvisionService",
        source: "provider-provision",
      })
    );
  });

  it("should rollback reached services and rethrow synchronous provider provision errors", () => {
    const error = new Error("provision-fail");
    const events: Array<string> = [];
    const onError = jest.fn();

    @Injectable()
    class FirstProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-first");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-first");
      }
    }

    @Injectable()
    class FailingProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-failing");

        throw error;
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-failing");
      }
    }

    @Injectable()
    class ThirdProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-third");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-third");
      }
    }

    const container: Container = new Container({
      bindings: [FirstProvisionService, FailingProvisionService, ThirdProvisionService],
      onError,
    });

    expect(() => provisionContainer(container)).toThrow(error);
    expect(events).toEqual(["provision-first", "provision-failing", "deprovision-failing", "deprovision-first"]);
    expect(getProvisionState(container)?.instances ?? null).toBeNull();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["FailingProvisionService", "onProvision"],
        error,
        message: "@OnProvision failed for",
        instanceName: "FailingProvisionService",
        source: "provider-provision",
      })
    );
  });

  it("should report rejected provider provision errors to container error handler", async () => {
    const error = new Error("async-provision-fail");
    const onError = jest.fn();

    @Injectable()
    class AsyncFailingProvisionService {
      @OnProvision()
      public async onProvision(): Promise<void> {
        throw error;
      }
    }

    const container: Container = new Container({
      bindings: [AsyncFailingProvisionService],
      onError,
    });

    provisionContainer(container, [AsyncFailingProvisionService]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["AsyncFailingProvisionService", "onProvision"],
        error,
        message: "@OnProvision rejected",
        instanceName: "AsyncFailingProvisionService",
        source: "provider-provision",
      })
    );
  });
});
