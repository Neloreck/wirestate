import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType, Container, Inject, Injectable } from "../alias";
import { OnActivated } from "../bind/instance/on-activated";
import { unbindAll } from "../bind/unbind";
import { Optional } from "../types/general";

import { ContainerProvisionLifecycle, deprovisionContainer, provisionContainer } from "./container-provision-lifecycle";
import { createContainer } from "./create-container";
import { WireScope } from "./wire-scope";

describe("provision lifecycle", () => {
  function createProvisionLifecycle(): ContainerProvisionLifecycle {
    return new Map();
  }

  it("should provision lifecycle services and deprovision them in reverse order", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const container: Container = createContainer({ activate: false, bindings: [FirstService, SecondService] });
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

    unbindAll(container);

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

    const container: Container = createContainer({
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

    const container: Container = createContainer({
      bindings: [PlainService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [PlainService]);

    expect(events).toEqual([]);
  });

  it("should track deprovision status for scoped services without provider lifecycle hooks", () => {
    const events: Array<string> = [];

    @Injectable()
    class ScopedPlainService {
      public constructor(
        @Inject(WireScope)
        public readonly scope: WireScope
      ) {}

      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container: Container = createContainer({
      bindings: [ScopedPlainService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [ScopedPlainService]);

    const service: ScopedPlainService = container.get(ScopedPlainService);

    expect(events).toEqual(["activated"]);
    expect(service.scope.isDeprovisioned).toBe(false);
    expect(service.scope.isInactive).toBe(false);

    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["activated"]);
    expect(service.scope.isDeprovisioned).toBe(true);
    expect(service.scope.isInactive).toBe(true);
  });

  it("should provision and deprovision each container once per lifecycle state", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });

    const container: Container = createContainer({
      bindings: [LifecycleService],
    });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [LifecycleService]);
    provisionContainer(container, lifecycle, [LifecycleService]);
    deprovisionContainer(container, lifecycle);
    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision"]);

    unbindAll(container);

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });

  it("should reset deprovision markers before reprovision and mark active scopes one by one", () => {
    type ScopedFixture = {
      readonly scope: {
        readonly isDeprovisioned: Optional<boolean>;
        readonly isInactive: boolean;
      };
    };

    const events: Array<string> = [];
    const state: { first: Optional<ScopedFixture>; second: Optional<ScopedFixture> } = {
      first: null,
      second: null,
    };

    const getScopeStates = (): string =>
      String(state.first?.scope.isDeprovisioned) + "-" + String(state.second?.scope.isDeprovisioned);

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

    const container: Container = createContainer({ bindings: [FirstService, SecondService] });
    const lifecycle: ContainerProvisionLifecycle = createProvisionLifecycle();

    state.first = container.get(FirstService);
    state.second = container.get(SecondService);

    expect(state.first.scope.isDeprovisioned).toBeNull();
    expect(state.second.scope.isDeprovisioned).toBeNull();
    expect(state.first.scope.isInactive).toBe(false);
    expect(state.second.scope.isInactive).toBe(false);

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(state.first.scope.isDeprovisioned).toBe(false);
    expect(state.second.scope.isDeprovisioned).toBe(false);
    expect(state.first.scope.isInactive).toBe(false);
    expect(state.second.scope.isInactive).toBe(false);
    expect(events).toEqual(["provision-first-false-null", "provision-second-false-false"]);

    deprovisionContainer(container, lifecycle);

    expect(state.first.scope.isDeprovisioned).toBe(true);
    expect(state.second.scope.isDeprovisioned).toBe(true);
    expect(state.first.scope.isInactive).toBe(true);
    expect(state.second.scope.isInactive).toBe(true);
    expect(events).toEqual([
      "provision-first-false-null",
      "provision-second-false-false",
      "deprovision-second-false-false",
      "deprovision-first-false-true",
    ]);

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

    expect(state.first.scope.isDeprovisioned).toBe(false);
    expect(state.second.scope.isDeprovisioned).toBe(false);
    expect(state.first.scope.isInactive).toBe(false);
    expect(state.second.scope.isInactive).toBe(false);
    expect(events).toEqual([
      "provision-first-false-null",
      "provision-second-false-false",
      "deprovision-second-false-false",
      "deprovision-first-false-true",
      "provision-first-false-null",
      "provision-second-false-false",
    ]);
  });
});
