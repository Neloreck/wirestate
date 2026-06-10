import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container, Injectable } from "../base";
import { OnProvision } from "../bind/instance/on-provision";
import { unbind, unbindAll } from "../bind/unbind";
import { getContainerBindings } from "../bind/utils/register-binding";
import {
  ContainerProvisionLifecycle,
  deprovisionContainer,
  provisionContainer,
} from "../container/container-provision-lifecycle";
import { createContainer } from "../container/create-container";
import { WireScope } from "../container/wire-scope";

describe("container operation edge cases", () => {
  it("treats deprovision of a never-provisioned container as a no-op", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = createContainer({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = new Map();

    container.get(LifecycleService);

    expect(events).toEqual(["activated"]);

    expect(() => deprovisionContainer(container, lifecycle)).not.toThrow();
    expect(lifecycle.has(container)).toBe(false);
    expect(events).toEqual(["activated"]);
  });

  it("treats provisioning with an empty bindings list as a no-op", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = createContainer({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = new Map();

    provisionContainer(container, lifecycle, []);

    expect(lifecycle.get(container)).toEqual([]);
    expect(events).toEqual([]);
  });

  it("throws when provisioning a participant binding the container does not declare", () => {
    @Injectable()
    class UnboundProvider {
      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = createContainer();

    expect(() => provisionContainer(container, new Map(), [UnboundProvider])).toThrow(
      "Cannot provision binding 'UnboundProvider' that is not bound on this container."
    );
  });

  it("ignores provisioning bindings without provider lifecycle hooks", () => {
    @Injectable()
    class PlainService {}

    const container: Container = createContainer({ bindings: [PlainService] });
    const lifecycle: ContainerProvisionLifecycle = new Map();

    expect(() => provisionContainer(container, lifecycle, [PlainService])).not.toThrow();
    expect(lifecycle.get(container)).toEqual([]);
  });

  it("returns an empty shared seed when none was configured", () => {
    const container: Container = createContainer();
    const scope: WireScope = new WireScope(container);

    expect(scope.getSeed()).toEqual({});
    expect(scope.getSeed("ANY_KEY")).toBeNull();
  });

  it("treats unbinding a never-bound token as a no-op", () => {
    const container: Container = createContainer();

    expect(() => unbind(container, "NEVER_BOUND")).not.toThrow();
    expect(container.hasOwn("NEVER_BOUND")).toBe(false);
    expect(getContainerBindings(container)).toEqual([]);
  });

  it("treats deprovision after a full unbind as a no-op", () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = createContainer({ bindings: [LifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = new Map();

    provisionContainer(container, lifecycle);
    expect(events).toEqual(["activated", "provision"]);

    unbindAll(container);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);

    const eventsAfterDisposal: Array<string> = [...events];

    expect(() => deprovisionContainer(container, lifecycle)).not.toThrow();
    expect(events).toEqual(eventsAfterDisposal);
    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
  });
});
