import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../container/container";
import { deprovisionContainer, provisionContainer } from "../container/container-provision-lifecycle";
import { createContainer } from "../container/create-container";
import { ContainerProvisionLifecycle } from "../container/provision-state";

describe("cross-container provider lifecycle ownership", () => {
  it("shares a single parent-owned instance by reference with child containers", () => {
    const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const parent: Container = createContainer({ bindings: [LifecycleService] });
    const child: Container = createContainer({ parent });

    expect(child.get(LifecycleService)).toBe(parent.get(LifecycleService));
  });

  it("throws when asked to provision a parent-owned binding from a child container", () => {
    const events: Array<string> = [];
    const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });

    // LifecycleService is bound only on the parent; the child merely inherits it.
    const parent: Container = createContainer({ bindings: [LifecycleService] });
    const child: Container = createContainer({ parent });

    const childLifecycle: ContainerProvisionLifecycle = new Map();

    expect(child.get(LifecycleService)).toBeInstanceOf(LifecycleService);

    expect(() => provisionContainer(child, childLifecycle, [LifecycleService])).toThrow(
      "Cannot provision binding 'LifecycleService' that is not bound on this container."
    );
    expect(events).toEqual([]);
  });

  it("provisions the child's own binding when a parent is present", () => {
    const events: Array<string> = [];
    const { LifecycleService: ParentService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: "parent",
    });
    const { LifecycleService: ChildService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: "child",
    });

    const parent: Container = createContainer({ bindings: [ParentService] });
    const child: Container = createContainer({ parent, bindings: [ChildService] });
    const childLifecycle: ContainerProvisionLifecycle = new Map();

    // The child owns ChildService, so its provider lifecycle works normally and
    // does not touch the inherited parent binding.
    provisionContainer(child, childLifecycle, [ChildService]);
    expect(events).toEqual(["provision-child"]);

    deprovisionContainer(child, childLifecycle);
    expect(events).toEqual(["provision-child", "deprovision-child"]);
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
