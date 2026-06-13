import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { Container } from "../container/container";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";

describe("cross-container provider lifecycle ownership", () => {
  it("shares a single parent-owned instance by reference with child containers", () => {
    const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const parent: Container = new Container({ bindings: [LifecycleService] });
    const child: Container = new Container({ parent });

    expect(child.get(LifecycleService)).toBe(parent.get(LifecycleService));
  });

  it("throws when asked to provision a parent-owned binding from a child container", () => {
    const events: Array<string> = [];
    const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });

    // LifecycleService is bound only on the parent; the child merely inherits it.
    const parent: Container = new Container({ bindings: [LifecycleService] });
    const child: Container = new Container({ parent });

    expect(child.get(LifecycleService)).toBeInstanceOf(LifecycleService);

    expect(() => provisionContainer(child, [LifecycleService])).toThrow(
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

    const parent: Container = new Container({ bindings: [ParentService] });
    const child: Container = new Container({ parent, bindings: [ChildService] });

    // The child owns ChildService, so its provider lifecycle works normally and
    // does not touch the inherited parent binding.
    provisionContainer(child, [ChildService]);
    expect(events).toEqual(["provision-child"]);

    deprovisionContainer(child);
    expect(events).toEqual(["provision-child", "deprovision-child"]);
  });

  it("runs @OnDeprovision from the owning (parent) container", () => {
    const events: Array<string> = [];
    const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });

    const parent: Container = new Container({ bindings: [LifecycleService] });

    provisionContainer(parent);
    expect(events).toEqual(["provision"]);

    deprovisionContainer(parent);
    expect(events).toEqual(["provision", "deprovision"]);
  });
});
