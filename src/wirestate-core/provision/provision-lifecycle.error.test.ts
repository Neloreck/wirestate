import { Container } from "../container/container";
import { Injectable } from "../metadata/metadata-injectable";
import { OnEvent } from "../plugin/events/on-event";

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

  it("throws when a service declares a messaging handler but no plugin handles its kind", () => {
    @Injectable()
    class EventListenerService {
      @OnEvent("PING")
      public onPing(): void {}
    }

    // Bound, but no EventsPlugin registered — the declared @OnEvent kind is unhandled.
    const container: Container = new Container({ bindings: [EventListenerService] });

    expect(() => provisionContainer(container, [EventListenerService])).toThrow(
      "Service 'EventListenerService' declares a messaging handler but no registered plugin handles it."
    );
  });

  it("formats the unowned-participant error with a string token for a symbol-bound participant", () => {
    @Injectable()
    class SymbolBoundProvider {
      @OnProvision()
      public onProvision(): void {}
    }

    const token: symbol = Symbol("symbol-provider");
    const container: Container = new Container();

    // The participant resolves to a lifecycle class but its token is not owned by the container.
    expect(() =>
      provisionContainer(container, [{ token: token, type: "Instance", value: SymbolBoundProvider }])
    ).toThrow("Cannot provision binding 'Symbol(symbol-provider)' that is not bound on this container.");
  });

  it("isolates parent and child provision cycles when a child teardown hook throws", () => {
    const events: Array<string> = [];
    const onError = jest.fn();

    @Injectable()
    class ParentService {
      @OnProvision()
      public onProvision(): void {
        events.push("parent-provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("parent-deprovision");
      }
    }

    @Injectable()
    class ChildService {
      @OnProvision()
      public onProvision(): void {
        events.push("child-provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("child-deprovision");

        throw new Error("child boom");
      }
    }

    const parent: Container = new Container({ bindings: [ParentService], onError });
    const child: Container = new Container({ parent: parent, bindings: [ChildService], onError });

    parent.provision();
    child.provision();

    expect(events).toEqual(["parent-provision", "child-provision"]);

    // A throwing child @OnDeprovision is contained and never touches the parent's cycle.
    expect(() => child.deprovision()).not.toThrow();
    expect(events).toEqual(["parent-provision", "child-provision", "child-deprovision"]);
    expect(getProvisionState(parent)?.status).toBe(true);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ source: "provider-deprovision", instanceName: "ChildService" })
    );

    // The parent still tears down cleanly on its own afterwards.
    events.length = 0;
    parent.deprovision();

    expect(events).toEqual(["parent-deprovision"]);
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
