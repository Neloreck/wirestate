import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType, Container, Inject, Injectable } from "../alias";
import { createContainer } from "../container/create-container";
import { WireScope } from "../container/wire-scope";
import { Optional } from "../types/general";

import { OnActivated } from "./on-activated";
import { deprovisionContainer, provisionContainer, ProvisionLifecycle } from "./provision-lifecycle";

describe("provision lifecycle", () => {
  function createProvisionLifecycle(): ProvisionLifecycle {
    return new Map();
  }

  it("should provision lifecycle services and deprovision them in reverse order", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const container: Container = createContainer({ activate: false, entries: [FirstService, SecondService] });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [FirstService, SecondService]);

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
    const TOKEN: unique symbol = Symbol("service");
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision"] });

    const container: Container = createContainer({
      entries: [
        {
          bindingType: BindingType.Instance,
          id: TOKEN,
          value: LifecycleService,
        },
      ],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [
      {
        bindingType: BindingType.Instance,
        id: TOKEN,
        value: LifecycleService,
      },
    ]);

    expect(events).toEqual(["provision"]);
  });

  it("should skip entries without provider lifecycle metadata", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container: Container = createContainer({
      entries: [PlainService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

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
      entries: [ScopedPlainService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

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
      entries: [LifecycleService],
    });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

    provisionContainer(container, lifecycle, [LifecycleService]);
    provisionContainer(container, lifecycle, [LifecycleService]);
    deprovisionContainer(container, lifecycle);
    deprovisionContainer(container, lifecycle);

    expect(events).toEqual(["provision", "deprovision"]);

    container.unbindAll();

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

    const container: Container = createContainer({ entries: [FirstService, SecondService] });
    const lifecycle: ProvisionLifecycle = createProvisionLifecycle();

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
