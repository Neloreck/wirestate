import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType, Container, Injectable } from "../alias";
import { createContainer } from "../container/create-container";

import { OnActivated } from "./on-activated";
import { deprovisionContainer, provisionContainer, ProvisionLifecycle } from "./provision-lifecycle";

describe("provision lifecycle", () => {
  function createProvisionLifecycle(): ProvisionLifecycle {
    return new Map();
  }

  it("should provision lifecycle services and deprovision them in reverse order", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const container: Container = createContainer({
      activate: false,
      entries: [FirstService, SecondService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "activated-second",
      "provision-second",
    ]);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "activated-second",
      "provision-second",
      "deprovision-second",
      "deprovision-first",
    ]);
  });

  it("should provision instance descriptors bound behind custom tokens", () => {
    const TOKEN: unique symbol = Symbol("service");
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision"] });

    const container: Container = createContainer({
      entries: [
        {
          bindingType: BindingType.Instance,
          id: TOKEN,
          value: LifecycleService,
        },
      ],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [
      {
        bindingType: BindingType.Instance,
        id: TOKEN,
        value: LifecycleService,
      },
    ]);

    expect(events).toEqual(["provision"]);
  });

  it("should skip entries without provider lifecycle metadata", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container: Container = createContainer({
      entries: [PlainService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [PlainService]);

    expect(events).toEqual([]);
  });

  it("should provision and deprovision each container once per lifecycle state", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });

    const container: Container = createContainer({
      entries: [LifecycleService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [LifecycleService]);
    provisionContainer(container, lifecycle, [LifecycleService]);
    deprovisionContainer(container, lifecycle);
    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision"]);

    container.unbindAll();

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });
});
