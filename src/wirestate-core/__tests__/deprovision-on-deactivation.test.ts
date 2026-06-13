import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../container/container";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";
import { ContainerProvisionLifecycle } from "../provision/provision-state";

describe("deprovision on deactivation", () => {
  function createProvisionLifecycle(): ContainerProvisionLifecycle {
    return new Map();
  }

  it("runs @OnDeprovision before @OnDeactivation when a provisioned instance is destroyed", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = new Container({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);
    expect(events).toEqual(["activated", "provision"]);

    container.unbind(LifecycleService);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
  });

  it("does not run @OnDeprovision when the instance was never provisioned", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = new Container({ bindings: [LifecycleService] });

    // Activate without provisioning (isDeprovisioned stays null, not false).
    container.get(LifecycleService);
    expect(events).toEqual(["activated"]);

    container.unbind(LifecycleService);

    expect(events).toEqual(["activated", "deactivation"]);
  });

  it("does not double-deprovision after an explicit container deprovision", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = new Container({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);
    deprovisionContainer(container, lifecycle);
    expect(events).toEqual(["activated", "provision", "deprovision"]);

    // The instance is already deprovisioned, so unbinding only deactivates it.
    container.unbind(LifecycleService);
    container.unbind(LifecycleService);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
  });
});
