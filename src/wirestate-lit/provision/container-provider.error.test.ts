import {
  Container,
  Injectable,
  OnDeactivation,
  OnDeprovision,
  OnProvision,
  createContainer,
} from "@wirestate/core";
import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators.js";

import { ContainerProvider } from "./container-provider";

describe("ContainerProvider provision errors", () => {
  @customElement("ws-container-provider-error-host")
  class TestProviderElement extends ReactiveElement {}

  it("should rollback failed external provision and rethrow without publishing or disposing the container", () => {
    const element: TestProviderElement = new TestProviderElement();
    const error = new Error("external-provision-fail");
    const events: Array<string> = [];

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

    const container: Container = createContainer({
      bindings: [FirstProvisionService, FailingProvisionService],
    });
    const unbindAllSpy = jest.spyOn(container, "unbindAll");
    const controller: ContainerProvider = new ContainerProvider(element, { container });

    expect(() => controller.hostConnected()).toThrow(error);
    expect(controller.value).toBeUndefined();
    expect(events).toEqual([
      "provision-first",
      "provision-failing",
      "deprovision-failing",
      "deprovision-first",
    ]);
    expect(unbindAllSpy).not.toHaveBeenCalled();
    expect(container.isBound(FirstProvisionService)).toBe(true);
    expect(container.isBound(FailingProvisionService)).toBe(true);
  });

  it("should rollback failed managed provision and rethrow before publishing the container", () => {
    const element: TestProviderElement = new TestProviderElement();
    const error = new Error("managed-provision-fail");
    const events: Array<string> = [];

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

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-first");
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

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-failing");
      }
    }

    @Injectable()
    class ThirdProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-third");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-third");
      }
    }

    const controller: ContainerProvider = new ContainerProvider(element, {
      config: {
        bindings: [FirstProvisionService, FailingProvisionService, ThirdProvisionService],
      },
    });

    expect(() => controller.hostConnected()).toThrow(error);
    expect(controller.value).toBeUndefined();
    expect(events).toEqual([
      "provision-first",
      "provision-failing",
      "deprovision-failing",
      "deprovision-first",
      "deactivation-first",
      "deactivation-failing",
      "deactivation-third",
    ]);
  });
});
