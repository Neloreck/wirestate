import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { WireStatus } from "../activation/wire-status";
import { Injectable } from "../metadata/metadata-injectable";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";
import { getProvisionState } from "../provision/provision-state";

import { Container } from "./container";

describe("container unbind deprovision", () => {
  it("should unbind a token and remove the container's own binding", () => {
    const { LifecycleService } = createLifecycleService();
    const container: Container = new Container({
      activate: false,
      bindings: [LifecycleService],
    });

    expect(container.getOwnBindings()).toContainEqual({
      token: LifecycleService,
      type: "Instance",
      value: LifecycleService,
    });

    container.unbind(LifecycleService);

    expect(container.hasOwn(LifecycleService)).toBe(false);
    expect(container.getOwnBindings()).not.toContainEqual(expect.objectContaining({ token: LifecycleService }));
  });

  it("should unbind all tokens and clear the container's own bindings", () => {
    const { LifecycleService } = createLifecycleService();
    const container: Container = new Container({
      activate: false,
      bindings: [LifecycleService, { token: "CONFIG", value: "config-value" }],
    });

    expect(container.getOwnBindings()).toContainEqual({
      token: LifecycleService,
      type: "Instance",
      value: LifecycleService,
    });
    expect(container.getOwnBindings()).toContainEqual({ token: "CONFIG", value: "config-value" });

    container.unbindAll();

    expect(container.hasOwn(LifecycleService)).toBe(false);
    expect(container.hasOwn("CONFIG")).toBe(false);
    expect(container.getOwnBindings()).toEqual([]);
  });

  it("should deprovision owned provider lifecycle services before unbinding", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });
    const container: Container = new Container({
      bindings: [LifecycleService],
    });

    provisionContainer(container);

    expect(events).toEqual(["provision"]);

    container.unbind(LifecycleService);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
    expect(getProvisionState(container)?.instances ?? null).toBeNull();

    deprovisionContainer(container);

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
    const container: Container = new Container({ bindings: [ServiceA, ServiceB] });

    provisionContainer(container);

    expect(events).toEqual(["provision-a", "provision-b"]);

    container.unbind(ServiceA);

    expect(events).toEqual(["provision-a", "provision-b", "deprovision-a", "deactivation-a"]);
    expect(getProvisionState(container)?.instances).toHaveLength(1);

    deprovisionContainer(container);

    expect(events).toEqual(["provision-a", "provision-b", "deprovision-a", "deactivation-a", "deprovision-b"]);
  });

  it("should deprovision and deactivate every provisioned service on unbindAll", () => {
    const events: Array<string> = [];
    const { LifecycleService: ServiceA } = createLifecycleService({ events, suffix: "a" });
    const { LifecycleService: ServiceB } = createLifecycleService({ events, suffix: "b" });
    const container: Container = new Container({ bindings: [ServiceA, ServiceB] });

    provisionContainer(container);

    expect(events).toEqual(["activated-a", "activated-b", "provision-a", "provision-b"]);

    container.unbindAll();

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

    const container: Container = new Container({ bindings: [LifecycleService] });

    provisionContainer(container);

    expect(events).toEqual(["activated", "provision"]);

    // A raw unbind destroys a still-provisioned instance: @OnDeprovision runs
    // before @OnDeactivation so provider resources are released.
    container.unbind(LifecycleService);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);

    // A later container deprovision must not re-fire teardown for the stale entry.
    deprovisionContainer(container);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(getProvisionState(container)?.instances ?? null).toBeNull();
  });

  it("is a no-op when unbinding a non-participant token while a participant stays provisioned", () => {
    @Injectable()
    class PlainService {}

    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });
    const container: Container = new Container({ bindings: [PlainService, LifecycleService] });

    provisionContainer(container);

    expect(events).toEqual(["provision"]);

    // PlainService is not a provider-lifecycle participant, so unbinding it must not
    // deprovision the still-provisioned LifecycleService.
    container.unbind(PlainService);

    expect(events).toEqual(["provision"]);
    expect(container.hasOwn(PlainService)).toBe(false);
    expect(getProvisionState(container)?.instances).toHaveLength(1);

    // A container deprovision runs @OnDeprovision (not @OnDeactivation, which is unbind-only).
    deprovisionContainer(container);

    expect(events).toEqual(["provision", "deprovision"]);
  });

  it("should mark remaining active services deprovisioned after the last lifecycle binding is unbound", () => {
    @Injectable()
    class PlainService {}

    const { LifecycleService, events } = createLifecycleService();
    const container: Container = new Container({ bindings: [PlainService, LifecycleService] });
    const plainService: PlainService = container.get(PlainService);
    const plainStatus: WireStatus = WireStatus.for(plainService);

    provisionContainer(container);

    expect(plainStatus.isDeprovisioned).toBe(false);

    // Unbinding the last lifecycle binding clears the container's instances entry.
    container.unbind(LifecycleService);

    expect(getProvisionState(container)?.instances ?? null).toBeNull();

    deprovisionContainer(container);

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(plainStatus.isDeprovisioned).toBe(true);
  });

  it("should not touch active statuses when deprovisioning a never-provisioned container", () => {
    @Injectable()
    class PlainService {}

    const container: Container = new Container({ bindings: [PlainService] });
    const status: WireStatus = WireStatus.for(container.get(PlainService));

    expect(status.isDeprovisioned).toBeNull();

    deprovisionContainer(container);

    expect(status.isDeprovisioned).toBeNull();
  });

  it("should keep deprovision idempotent after the lifecycle entry is gone", () => {
    @Injectable()
    class PlainService {}

    const { LifecycleService, events } = createLifecycleService();
    const container: Container = new Container({ bindings: [PlainService, LifecycleService] });
    const plainStatus: WireStatus = WireStatus.for(container.get(PlainService));

    provisionContainer(container);
    container.unbind(LifecycleService);
    deprovisionContainer(container);

    expect(plainStatus.isDeprovisioned).toBe(true);

    // Resurrect the flag to prove a second deprovision of an already
    // deprovisioned container does not re-mark active instances.
    plainStatus.isDeprovisioned = false;

    deprovisionContainer(container);

    expect(plainStatus.isDeprovisioned).toBe(false);
    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
  });
});
