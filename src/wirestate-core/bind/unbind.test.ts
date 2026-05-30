import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../alias";
import { createContainer } from "../container/create-container";
import { deprovisionContainer, provisionContainer, ProvisionLifecycle } from "../service/provision-lifecycle";

import { getContainerBindings } from "./register-binding";
import { unbind, unbindAll } from "./unbind";

describe("unbind", () => {
  function createProvisionLifecycle(): ProvisionLifecycle {
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

    expect(container.isCurrentBound(LifecycleService)).toBe(false);
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

    expect(container.isCurrentBound(LifecycleService)).toBe(false);
    expect(container.isCurrentBound("CONFIG")).toBe(false);
    expect(getContainerBindings(container)).toEqual([]);
  });

  it("should deprovision owned provider lifecycle services before unbinding", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });
    const container: Container = createContainer({
      bindings: [LifecycleService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["provision"]);

    unbind(container, LifecycleService);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
    expect(lifecycle.has(container)).toBe(false);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });

  it("should not deprovision stale provider lifecycle entries after raw container unbind", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });
    const container: Container = createContainer({
      bindings: [LifecycleService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["provision"]);

    container.unbind(LifecycleService);

    expect(events).toEqual(["provision", "deactivation"]);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deactivation"]);
    expect(lifecycle.has(container)).toBe(false);
  });
});
