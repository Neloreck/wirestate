import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../alias";
import {
  ContainerProvisionLifecycle,
  deprovisionContainer,
  provisionContainer,
} from "../container/container-provision-lifecycle";
import { createContainer } from "../container/create-container";

import { unbind, unbindAll } from "./unbind";
import { getContainerBindings } from "./utils/register-binding";

describe("unbind", () => {
  function createProvisionLifecycle(): ContainerProvisionLifecycle {
    return new Map();
  }

  it("should unbind a token and remove Wirestate binding registry entries", () => {
    const { LifecycleService } = createLifecycleService();
    const container: Container = createContainer({
      activate: false,
      bindings: [LifecycleService],
    });

    expect(getContainerBindings(container)).toEqual([LifecycleService]);

    unbind(container, LifecycleService);

    expect(container.hasOwn(LifecycleService)).toBe(false);
    expect(getContainerBindings(container)).toEqual([]);
  });

  it("should unbind all tokens and clear Wirestate binding registry entries", () => {
    const { LifecycleService } = createLifecycleService();
    const container: Container = createContainer({
      activate: false,
      bindings: [LifecycleService, { token: "CONFIG", value: "config-value" }],
    });

    expect(getContainerBindings(container)).toEqual([LifecycleService, { token: "CONFIG", value: "config-value" }]);

    unbindAll(container);

    expect(container.hasOwn(LifecycleService)).toBe(false);
    expect(container.hasOwn("CONFIG")).toBe(false);
    expect(getContainerBindings(container)).toEqual([]);
  });

  it("should deprovision owned provider lifecycle services before unbinding", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });
    const container: Container = createContainer({
      bindings: [LifecycleService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["provision"]);

    unbind(container, LifecycleService);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
    expect(lifecycle.has(container)).toBe(false);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });

  it("should deprovision only the unbound service and keep the rest provisioned", () => {
    const events: Array<string> = [];
    const { LifecycleService: ServiceA } = createLifecycleService({
      events,
      methods: ["provision", "deprovision", "deactivation"],
      suffix: "a",
    });
    const { LifecycleService: ServiceB } = createLifecycleService({
      events,
      methods: ["provision", "deprovision", "deactivation"],
      suffix: "b",
    });
    const container: Container = createContainer({ bindings: [ServiceA, ServiceB] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["provision-a", "provision-b"]);

    unbind(container, ServiceA);

    expect(events).toEqual(["provision-a", "provision-b", "deprovision-a", "deactivation-a"]);
    expect(lifecycle.has(container)).toBe(true);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision-a", "provision-b", "deprovision-a", "deactivation-a", "deprovision-b"]);
  });

  it("should deprovision and deactivate every provisioned service on unbindAll", () => {
    const events: Array<string> = [];
    const { LifecycleService: ServiceA } = createLifecycleService({ events, suffix: "a" });
    const { LifecycleService: ServiceB } = createLifecycleService({ events, suffix: "b" });
    const container: Container = createContainer({ bindings: [ServiceA, ServiceB] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["activated-a", "activated-b", "provision-a", "provision-b"]);

    unbindAll(container);

    expect(events).toEqual([
      "activated-a",
      "activated-b",
      "provision-a",
      "provision-b",
      "deprovision-b",
      "deprovision-a",
      "deactivation-a",
      "deactivation-b",
    ]);
  });

  it("should deprovision a provisioned instance on raw unbind and not re-deprovision afterwards", () => {
    const { LifecycleService, events } = createLifecycleService();

    const container: Container = createContainer({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["activated", "provision"]);

    // A raw unbind destroys a still-provisioned instance: @OnDeprovision runs
    // before @OnDeactivation so provider resources are released.
    container.unbind(LifecycleService);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);

    // A later container deprovision must not re-fire teardown for the stale entry.
    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(lifecycle.has(container)).toBe(false);
  });
});
