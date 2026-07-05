import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../container/container";
import { inject } from "../container/container-context";
import { Injectable } from "../metadata/metadata-injectable";
import { CommandBus } from "../plugin/commands/command-bus";
import { CommandsPlugin } from "../plugin/commands/commands-plugin";
import { EventBus } from "../plugin/events/event-bus";
import { EventsPlugin } from "../plugin/events/events-plugin";
import { QueriesPlugin } from "../plugin/queries/queries-plugin";
import { QueryBus } from "../plugin/queries/query-bus";
import { setContainerProvisioned } from "../provision/provision-state";

import { finalizeInstanceStatus, initializeInstanceStatus } from "./activation-lifecycle";
import { OnActivation } from "./on-activation";
import { OnDeactivation } from "./on-deactivation";
import { getInstanceContainer, WireStatus } from "./wire-status";

describe("instance lifecycle tracking", () => {
  it("should track activated instances by container at commit", () => {
    @Injectable()
    class TestService {}

    const container: Container = new Container();

    container.bind({ token: TestService, type: "Instance", value: TestService });

    expect(container.getActiveInstances()).toEqual([]);

    const instance: TestService = container.get(TestService);

    expect(container.getActiveInstances()).toEqual([instance]);
    expect(getInstanceContainer(instance)).toBe(container);
  });

  it("should not re-construct a singleton when @OnActivation resolves the same token", () => {
    const constructed = jest.fn();
    const activated = jest.fn();

    @Injectable()
    class SelfResolvingService {
      public self?: SelfResolvingService;

      public constructor() {
        constructed();
      }

      @OnActivation()
      public onActivation(): void {
        activated();
        // Transitively resolving the same token during activation must return this instance,
        // not construct a duplicate singleton (which previously recursed until the stack overflowed).
        this.self = inject(SelfResolvingService);
      }
    }

    const container: Container = new Container({ bindings: [SelfResolvingService] });

    const first: SelfResolvingService = container.get(SelfResolvingService);
    const second: SelfResolvingService = container.get(SelfResolvingService);

    expect(first).toBe(second);
    expect(first.self).toBe(first);
    expect(constructed).toHaveBeenCalledTimes(1);
    expect(activated).toHaveBeenCalledTimes(1);
    expect(container.getActiveInstances()).toEqual([first]);
  });

  // Pathological edge, pinned intentionally: unbinding a token from within its own  @OnActivation.
  it("returns a deactivated, untracked instance when @OnActivation unbinds its own token", () => {
    const events: Array<string> = [];

    @Injectable()
    class SelfUnbindService {
      public constructor(public readonly host = inject(Container)) {}

      @OnActivation()
      public onActivation(): void {
        events.push("activation");
        this.host.unbind(SelfUnbindService);
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation");
      }
    }

    const container: Container = new Container();

    container.bind({ token: SelfUnbindService, type: "Instance", value: SelfUnbindService });

    const instance: SelfUnbindService = container.get(SelfUnbindService);

    expect(instance).toBeInstanceOf(SelfUnbindService);
    // @OnDeactivation runs mid-activation, right after @OnActivation's unbind call.
    expect(events).toEqual(["activation", "deactivation"]);
    expect(WireStatus.for(instance).isDeactivated).toBe(true);
    expect(container.getActiveInstances()).toEqual([]);
    // The token is unbound, so a later resolution fails rather than returning the orphan.
    expect(() => container.get(SelfUnbindService)).toThrow("No binding(s) found");
  });

  it("should clean up tracked instances when activation fails", () => {
    @Injectable()
    class FailingService {
      @OnActivation()
      public onActivation(): void {
        throw new Error("activation-fail");
      }
    }

    const onError = jest.fn();
    const container: Container = new Container({ onError });

    container.bind({ token: FailingService, type: "Instance", value: FailingService });

    expect(() => container.get(FailingService)).toThrow("activation-fail");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.getActiveInstances()).toEqual([]);
  });

  it("evicts the failed instance from the cache so a later get() reconstructs it", () => {
    const onError = jest.fn();
    let constructions = 0;
    let failActivation = true;

    @Injectable()
    class FlakyService {
      public constructor() {
        constructions += 1;
      }

      @OnActivation()
      public onActivation(): void {
        if (failActivation) {
          failActivation = false;

          throw new Error("activation-fail");
        }
      }
    }

    const container: Container = new Container({ onError });

    container.bind({ token: FlakyService, type: "Instance", value: FlakyService });

    // First resolution fails activation and must evict the half-activated instance from the cache.
    expect(() => container.get(FlakyService)).toThrow("activation-fail");
    expect(constructions).toBe(1);

    // Because it was evicted (not just dropped from `activated`), a second get() reconstructs a
    // fresh instance instead of returning the poisoned cached one. Removing `instances.delete`
    // in evict() would return the first instance here and leave `constructions` at 1.
    const instance: FlakyService = container.get(FlakyService);

    expect(instance).toBeInstanceOf(FlakyService);
    expect(constructions).toBe(2);
    expect(container.getActiveInstances()).toEqual([instance]);
  });

  it("should untrack deactivated instances by container", () => {
    @Injectable()
    class TestService {}

    const container: Container = new Container();

    container.bind({ token: TestService, type: "Instance", value: TestService });

    const instance: TestService = container.get(TestService);

    expect(container.getActiveInstances()).toEqual([instance]);

    container.unbind(TestService);

    expect(container.getActiveInstances()).toEqual([]);
    expect(getInstanceContainer(instance)).toBeUndefined();
  });

  it("should not report value or factory binding values as active instances", () => {
    const container: Container = new Container();

    container.bind({ token: "config", value: { key: "value" } });
    container.bind({ token: "made", factory: () => ({ made: true }) });

    container.get("config");
    container.get("made");

    expect(container.getActiveInstances()).toEqual([]);
  });

  it("should fully wire bare-class binds through the container", () => {
    const container: Container = new Container({
      bindings: [GenericService],
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
    }).provision();

    const instance: GenericService = container.get(GenericService);

    expect(instance.isActivated).toBe(true);

    container.get(EventBus).emit("TEST_STRING_EVENT", "string-event-data");

    expect(instance.isTestStringEventReceived).toBe(true);
    expect(container.get(QueryBus).query("TEST_STRING_QUERY")).toBe("string-query-response");
    expect(container.get(CommandBus).execute("TEST_SYNC_COMMAND", 800)).toBe(1800);

    container.unbind(GenericService);

    expect(instance.isActivated).toBe(false);
    expect(container.get(QueryBus).hasHandler("TEST_STRING_QUERY")).toBe(false);
    expect(container.get(CommandBus).hasHandler("TEST_SYNC_COMMAND")).toBe(false);
  });

  it("should expose own bindings in registration order", () => {
    @Injectable()
    class TestService {}

    const container: Container = new Container();
    const valueBinding = { token: "config", value: 1 };
    const instanceBinding = { token: TestService, type: "Instance", value: TestService } as const;

    container.bind(valueBinding).bind(instanceBinding);

    const bindings = container.getOwnBindings();

    expect(bindings[0]).toEqual({ token: Container, value: container });
    expect(bindings[1]).toBe(valueBinding);
    expect(bindings[2]).toBe(instanceBinding);
  });
});

describe("instance status", () => {
  it("should initialize an untracked instance with null provider status", () => {
    const container: Container = new Container();
    const instance: object = {};

    expect(() => WireStatus.for(instance)).toThrow("Object is not tracked by Wirestate.");

    initializeInstanceStatus(container, instance);

    expect(WireStatus.for(instance)).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should derive deprovisioned status from container provision state", () => {
    const provisionedContainer: Container = new Container();
    const deprovisionedContainer: Container = new Container();
    const provisionedInstance: object = {};
    const deprovisionedInstance: object = {};

    setContainerProvisioned(provisionedContainer, true);
    setContainerProvisioned(deprovisionedContainer, false);

    initializeInstanceStatus(provisionedContainer, provisionedInstance);
    initializeInstanceStatus(deprovisionedContainer, deprovisionedInstance);

    expect(WireStatus.for(provisionedInstance).isDeprovisioned).toBe(false);
    expect(WireStatus.for(deprovisionedInstance).isDeprovisioned).toBe(true);
  });

  it("should reuse and reset a reserved status during initialization", () => {
    const container: Container = new Container();
    const instance: object = {};
    const status: WireStatus = WireStatus.for(instance, { initialize: true });

    status.isDeactivated = true;
    status.isDeprovisioned = true;
    status.provisionId = 10;

    initializeInstanceStatus(container, instance);

    expect(WireStatus.for(instance)).toBe(status);
    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should mark an initialized instance as disposed and deprovisioned on unregister", () => {
    const container: Container = new Container();
    const instance: object = {};

    initializeInstanceStatus(container, instance);
    finalizeInstanceStatus(instance);

    expect(WireStatus.for(instance)).toEqual({
      isDeactivated: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });
});
