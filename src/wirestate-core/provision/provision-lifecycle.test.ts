import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { OnActivation } from "../activation/on-activation";
import { type ProvisionId, WireStatus } from "../activation/wire-status";
import { BindingType } from "../binding/binding";
import { Container } from "../container/container";
import { inject } from "../container/container-context";
import { Injectable } from "../metadata/metadata-injectable";
import { type Nullable } from "../types/general";

import { OnDeprovision } from "./on-deprovision";
import { OnProvision } from "./on-provision";
import { deprovisionContainer, provisionContainer } from "./provision-lifecycle";
import { getProvisionState } from "./provision-state";

describe("provision lifecycle", () => {
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
    // self-binding, buses, and both services. Only the
    // provision-decorated service may be resolved and provisioned.
    const container: Container = new Container({ bindings: [PlainService, ProvisionedService] });

    provisionContainer(container);

    expect(events).toEqual(["provision"]);
    expect(getProvisionState(container)?.instances).toEqual([container.get(ProvisionedService)]);

    deprovisionContainer(container);

    expect(events).toEqual(["provision", "deprovision"]);
  });

  it("should provision lifecycle services and deprovision them in reverse order", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const container: Container = new Container({ activate: false, bindings: [FirstService, SecondService] });

    provisionContainer(container);

    expect(events).toEqual(["activated-first", "activated-second", "provision-first", "provision-second"]);

    deprovisionContainer(container);

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

    provisionContainer(container, [
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
      @OnActivation()
      public onActivation(): void {
        events.push("activated");
      }
    }

    const container: Container = new Container({
      bindings: [PlainService],
    });

    provisionContainer(container, [PlainService]);

    expect(events).toEqual([]);
  });

  it("should track deprovision status for already resolved services without provider lifecycle hooks", () => {
    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      @OnActivation()
      public onActivation(): void {
        events.push("activated");
      }
    }

    const container: Container = new Container({
      bindings: [PlainService],
    });
    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    provisionContainer(container, [PlainService]);

    expect(events).toEqual(["activated"]);
    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container);

    expect(events).toEqual(["activated"]);
    expect(status).toEqual({
      isDeactivated: false,
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

    provisionContainer(container, [PlainService]);

    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container);

    expect(status).toEqual({
      isDeactivated: false,
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

    provisionContainer(container);

    const service: PlainService = container.get(TOKEN);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container);

    expect(status).toEqual({
      isDeactivated: false,
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
      public constructor(private readonly container: Container = inject(Container)) {}

      @OnActivation()
      public onActivation(): void {
        this.container.get(PlainService);
      }

      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({
      bindings: [PlainService, ResolvingLifecycleService],
    });

    provisionContainer(container, [PlainService, ResolvingLifecycleService]);

    const service: PlainService = container.get(PlainService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container);

    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should throw when provisioning an already provisioned container and keep deprovision idempotent", () => {
    const { LifecycleService, events } = createLifecycleService({
      methods: ["provision", "deprovision", "deactivation"],
    });

    const container: Container = new Container({
      bindings: [LifecycleService],
    });

    provisionContainer(container, [LifecycleService]);

    expect(() => provisionContainer(container, [LifecycleService])).toThrow(
      "Container is already provisioned. Deprovision it before provisioning it again."
    );

    deprovisionContainer(container);
    deprovisionContainer(container);

    expect(events).toEqual(["provision", "deprovision"]);

    container.unbindAll();

    expect(events).toEqual(["provision", "deprovision", "deactivation"]);
  });

  it("should reset deprovision markers before reprovision and mark active instances one by one", () => {
    const events: Array<string> = [];

    let first: Nullable<object> = null as Nullable<object>;
    let second: Nullable<object> = null as Nullable<object>;

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

    first = container.get(FirstService);
    second = container.get(SecondService);

    const firstStatus: WireStatus = WireStatus.for(first);
    const secondStatus: WireStatus = WireStatus.for(second);

    expect(firstStatus.isDeprovisioned).toBeNull();
    expect(secondStatus.isDeprovisioned).toBeNull();
    expect(firstStatus.isInactive).toBe(false);
    expect(secondStatus.isInactive).toBe(false);

    provisionContainer(container, [FirstService, SecondService]);

    expect(firstStatus.isDeprovisioned).toBe(false);
    expect(secondStatus.isDeprovisioned).toBe(false);
    expect(firstStatus.isInactive).toBe(false);
    expect(secondStatus.isInactive).toBe(false);
    expect(events).toEqual(["provision-first-false-null", "provision-second-false-false"]);

    deprovisionContainer(container);

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

    provisionContainer(container, [FirstService, SecondService]);

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
    const service: ScopedLifecycleService = container.get(ScopedLifecycleService);
    const status: WireStatus = WireStatus.for(service);

    expect(status.provisionId).toBeNull();

    provisionContainer(container, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(1);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toEqual(["provision-1-1"]);

    deprovisionContainer(container);

    expect(status.provisionId).toBe(1);
    expect(status.isDeprovisioned).toBe(true);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1"]);

    provisionContainer(container, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(2);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1", "provision-2-2"]);

    deprovisionContainer(container);

    expect(status.provisionId).toBe(2);
    expect(status.isDeprovisioned).toBe(true);
    expect(events).toEqual(["provision-1-1", "deprovision-1-1", "provision-2-2", "deprovision-2-2"]);
  });

  it("should increment provision IDs when the same instance is reprovisioned", () => {
    const events: Array<string> = [];

    @Injectable()
    class ScopedLifecycleService {
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
    const service: ScopedLifecycleService = container.get(ScopedLifecycleService);
    const status: WireStatus = WireStatus.for(service);

    for (let it = 0; it < 10; it++) {
      provisionContainer(container, [ScopedLifecycleService]);
      deprovisionContainer(container);
    }

    provisionContainer(container, [ScopedLifecycleService]);

    expect(status.provisionId).toBe(11);
    expect(status.isDeprovisioned).toBe(false);
    expect(events).toHaveLength(21);
  });

  it("should reset provision IDs before reprovision reaches each instance", () => {
    let first: Nullable<object> = null as Nullable<object>;
    let second: Nullable<object> = null as Nullable<object>;

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

    first = container.get(FirstService);
    second = container.get(SecondService);

    const firstStatus: WireStatus = WireStatus.for(first);
    const secondStatus: WireStatus = WireStatus.for(second);

    provisionContainer(container, [FirstService, SecondService]);
    deprovisionContainer(container);
    provisionContainer(container, [FirstService, SecondService]);

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
