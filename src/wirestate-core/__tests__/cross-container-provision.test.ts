import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../alias";
import {
  ContainerProvisionLifecycle,
  deprovisionContainer,
  provisionContainer,
} from "../container/container-provision-lifecycle";
import { createContainer } from "../container/create-container";

describe("cross-container provider lifecycle ownership", () => {
  it("shares a single parent-owned instance by reference with child containers", () => {
    const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const parent: Container = createContainer({ bindings: [LifecycleService] });
    const child: Container = createContainer({ parent });

    expect(child.get(LifecycleService)).toBe(parent.get(LifecycleService));
  });

  it("does not run @OnDeprovision from a child for a parent-owned instance", () => {
    const events: Array<string> = [];
    const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });

    const parent: Container = createContainer({ bindings: [LifecycleService] });
    const child: Container = createContainer({ parent });

    const childLifecycle: ContainerProvisionLifecycle = new Map();

    child.get(LifecycleService);

    provisionContainer(child, childLifecycle, [LifecycleService]);
    expect(events).toEqual(["provision"]);

    // The child does not own the instance, so its deprovision must not tear it
    // down — only the owning (parent) container is responsible for teardown.
    deprovisionContainer(child, childLifecycle);
    expect(events).toEqual(["provision"]);
  });

  it("runs @OnDeprovision from the owning (parent) container", () => {
    const events: Array<string> = [];
    const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });

    const parent: Container = createContainer({ bindings: [LifecycleService] });
    const parentLifecycle: ContainerProvisionLifecycle = new Map();

    provisionContainer(parent, parentLifecycle);
    expect(events).toEqual(["provision"]);

    deprovisionContainer(parent, parentLifecycle);
    expect(events).toEqual(["provision", "deprovision"]);
  });
});
