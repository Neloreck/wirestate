import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType } from "../binding/binding";
import { OnActivated } from "../lifecycle/on-activated";
import { OnDeprovision } from "../lifecycle/on-deprovision";
import { OnProvision } from "../lifecycle/on-provision";
import { Injectable } from "../metadata/injectable";
import { Optional } from "../types/general";

import { Container } from "./container";
import { deprovisionContainer, provisionContainer } from "./container-provision-lifecycle";
import { inject } from "./context";
import { ContainerProvisionLifecycle } from "./provision-state";
import { WireScope } from "./wire-scope";
import { ProvisionId, WireStatus } from "./wire-status";

describe("provision lifecycle", () => {
  function createProvisionLifecycle(): ContainerProvisionLifecycle {
    return new Map();
  }

  it("should provision exactly the decorated services among infra bindings", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      public constructor() {
        events.push("plain-constructed");
      }
    }

    @Injectable()
    class ProvisionedService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision");
      }
    }

    // The default provisioning scan walks every own binding: the container
    // self-binding, seeds, buses, WireScope, and both services. Only the
    // provision-decorated service may be resolved and provisioned.
    const container: Container = new Container({ bindings: [PlainService, ProvisionedService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["provision"]);
    expect(lifecycle.get(container)).toEqual([container.get(ProvisionedService)]);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision"]);
  });

  it("should provision lifecycle services and deprovision them in reverse order", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const container: Container = new Container({ activate: false, bindings: [FirstService, SecondService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    expect(events).toEqual(["activated-first", "activated-second", "provision-first", "provision-second"]);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual([
      "activated-first",
      "activated-second",
      "provision-first",
      "provision-second",
      "deprovision-second",
      "deprovision-first",
    ]);

    container.unbindAll();

    expect(events).toEqual([
      "activated-first",
      "activated-second",
      "provision-first",
      "provision-second",
      "deprovision-second",
      "deprovision-first",
      "deactivation-first",
      "deactivation-second",
    ]);
  });

  it("should provision instance descriptors bound behind custom tokens", () => {
    const TOKEN: unique symbol = Symbol("token");
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision"] });

    const container: Container = new Container({
      bindings: [
        {
          type: BindingType.Instance,
          token: TOKEN,
          value: LifecycleService,
        },
      ],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [
      {
        type: BindingType.Instance,
        token: TOKEN,
        value: LifecycleService,
      },
    ]);

    expect(events).toEqual(["provision"]);
  });

  it("should skip bindings without provider lifecycle metadata", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container: Container = new Container({
      bindings: [PlainService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [PlainService]);

    expect(events).toEqual([]);
  });

  it("should track deprovision status for already resolved services without provider lifecycle hooks", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container: Container = new Container({
      bindings: [PlainService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();
    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    provisionContainer(container, lifecycle, [PlainService]);

    expect(events).toEqual(["activated"]);
    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["activated"]);
    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should track services resolved after provider provisioning without provider hooks", () => {
    @Injectable()
    class PlainService {}

    const container: Container = new Container({
      bindings: [PlainService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [PlainService]);

    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container, lifecycle);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should track services bound behind custom tokens after provider provisioning", () => {
    const TOKEN: unique symbol = Symbol("plain-token");

    @Injectable()
    class PlainService {}

    const container: Container = new Container({
      bindings: [
        {
          type: BindingType.Instance,
          token: TOKEN,
          value: PlainService,
        },
      ],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle);

    const service: PlainService = container.get(TOKEN);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container, lifecycle);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should track services resolved while resolving lifecycle participants", () => {
    @Injectable()
    class PlainService {}

    @Injectable()
    class ResolvingLifecycleService {
      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnActivated()
      public onActivated(): void {
        this.scope.resolve(PlainService);
      }

      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({
      bindings: [PlainService, ResolvingLifecycleService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [PlainService, ResolvingLifecycleService]);

    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container, lifecycle);

    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should provision and deprovision each container once per lifecycle state", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });

    const container: Container = new Container({
      bindings: [LifecycleService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [LifecycleService]);
    provisionContainer(container, lifecycle, [LifecycleService]);
    deprovisionContainer(container, lifecycle);
    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision"]);

    container.unbindAll();

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });

  it("should reset deprovision markers before reprovision and mark active instances one by one", () => {
    const events: Array<string> = [];

    let first: Optional<object> = null as Optional<object>;
    let second: Optional<object> = null as Optional<object>;

    const getScopeStates = (): string =>
      String(first ? WireStatus.for(first).isDeprovisioned : undefined) +
      "-" +
      String(second ? WireStatus.for(second).isDeprovisioned : undefined);

    const { LifecycleService: FirstService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: () => "first-" + getScopeStates(),
    });
    const { LifecycleService: SecondService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: () => "second-" + getScopeStates(),
    });

    const container: Container = new Container({ bindings: [FirstService, SecondService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    first = container.get(FirstService);
    second = container.get(SecondService);

    const firstStatus: WireStatus = WireStatus.for(first);
    const secondStatus: WireStatus = WireStatus.for(second);

    expect(firstStatus.isDeprovisioned).toBeNull();
    expect(secondStatus.isDeprovisioned).toBeNull();
    expect(firstStatus.isInactive).toBe(false);
    expect(secondStatus.isInactive).toBe(false);

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(firstStatus.isDeprovisioned).toBe(false);
    expect(secondStatus.isDeprovisioned).toBe(false);
    expect(firstStatus.isInactive).toBe(false);
    expect(secondStatus.isInactive).toBe(false);
    expect(events).toEqual(["provision-first-false-null", "provision-second-false-false"]);

    deprovisionContainer(container, lifecycle);

    expect(firstStatus.isDeprovisioned).toBe(true);
    expect(secondStatus.isDeprovisioned).toBe(true);
    expect(firstStatus.isInactive).toBe(true);
    expect(secondStatus.isInactive).toBe(true);
    expect(events).toEqual([
      "provision-first-false-null",
      "provision-second-false-false",
      "deprovision-second-false-false",
      "deprovision-first-false-true",
    ]);

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(firstStatus.isDeprovisioned).toBe(false);
    expect(secondStatus.isDeprovisioned).toBe(false);
    expect(firstStatus.isInactive).toBe(false);
    expect(secondStatus.isInactive).toBe(false);
    expect(events).toEqual([
      "provision-first-false-null",
      "provision-second-false-false",
      "deprovision-second-false-false",
      "deprovision-first-false-true",
      "provision-first-false-null",
      "provision-second-false-false",
    ]);
  });

  it("should pass provision IDs to provision and deprovision handlers", () => {
    const events: Array<string> = [];

    @Injectable()
    class ScopedLifecycleService {
      public constructor(public readonly scope: WireScope = inject(WireScope)) {}

      @OnProvision()
      public onProvision(provisionId: ProvisionId): void {
        events.push("provision-" + provisionId + "-" + String(WireStatus.for(this).provisionId));
      }

      @OnDeprovision()
      public onDeprovision(provisionId: ProvisionId): void {
        events.push("deprovision-" + provisionId + "-" + String(WireStatus.for(this).provisionId));
      }
    }

    const container: Container = new Container({ bindings: [ScopedLifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();
    const service: ScopedLifecycleService = container.get(ScopedLifecycleService);
    const status: WireStatus = WireStatus.for(service);

    expect(status.provisionId).toBeNull();

    provisionContainer(container, lifecycle, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(1);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toEqual(["provision-1-1"]);

    deprovisionContainer(container, lifecycle);

    expect(status.provisionId).toBe(1);
    expect(status.isDeprovisioned).toBe(true);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1"]);

    provisionContainer(container, lifecycle, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(2);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1", "provision-2-2"]);

    deprovisionContainer(container, lifecycle);

    expect(status.provisionId).toBe(2);
    expect(status.isDeprovisioned).toBe(true);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1", "provision-2-2", "deprovision-2-2"]);
  });

  it("should increment provision IDs when the same instance is reprovisioned", () => {
    const events: Array<string> = [];

    @Injectable()
    class ScopedLifecycleService {
      public constructor(public readonly scope: WireScope = inject(WireScope)) {}

      @OnProvision()
      public onProvision(provisionId: ProvisionId): void {
        events.push("provision-" + provisionId);
      }

      @OnDeprovision()
      public onDeprovision(provisionId: ProvisionId): void {
        events.push("deprovision-" + provisionId);
      }
    }

    const container: Container = new Container({ bindings: [ScopedLifecycleService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();
    const service: ScopedLifecycleService = container.get(ScopedLifecycleService);
    const status: WireStatus = WireStatus.for(service);

    for (let it = 0; it < 10; it++) {
      provisionContainer(container, lifecycle, [ScopedLifecycleService]);
      deprovisionContainer(container, lifecycle);
    }

    provisionContainer(container, lifecycle, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(11);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toHaveLength(21);
  });

  it("should reset provision IDs before reprovision reaches each instance", () => {
    let first: Optional<object> = null as Optional<object>;
    let second: Optional<object> = null as Optional<object>;

    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: () =>
        "first-" +
        String(first ? WireStatus.for(first).provisionId : undefined) +
        "-" +
        String(second ? WireStatus.for(second).provisionId : undefined),
    });
    const { LifecycleService: SecondService } = createLifecycleService({
      events,
      methods: ["provision", "deprovision"],
      suffix: () =>
        "second-" +
        String(first ? WireStatus.for(first).provisionId : undefined) +
        "-" +
        String(second ? WireStatus.for(second).provisionId : undefined),
    });

    const container: Container = new Container({ bindings: [FirstService, SecondService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    first = container.get(FirstService);
    second = container.get(SecondService);

    const firstStatus: WireStatus = WireStatus.for(first);
    const secondStatus: WireStatus = WireStatus.for(second);

    provisionContainer(container, lifecycle, [FirstService, SecondService]);
    deprovisionContainer(container, lifecycle);
    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(firstStatus.provisionId).toBe(2);
    expect(secondStatus.provisionId).toBe(2);
    expect(events).toEqual([
      "provision-first-1-null",
      "provision-second-1-1",
      "deprovision-second-1-1",
      "deprovision-first-1-1",
      "provision-first-2-null",
      "provision-second-2-2",
    ]);
  });
});
