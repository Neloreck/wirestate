import { OnDeactivation } from "../activation/on-deactivation";
import { Container } from "../container/container";
import { inject } from "../container/container-context";
import { Injectable } from "../metadata/metadata-injectable";
import { OnDeprovision } from "../provision/on-deprovision";
import { OnProvision } from "../provision/on-provision";
import { type Newable } from "../types/general";

import { type HotSwapOwner, registerHotSwapOwner } from "./hot-owner";
import { getHotState, getLatestHotClass, isHotSwapping, registerHotModule } from "./hot-registry";
import { isHotConfigOutdated, remapHotBinding, remapHotConfig } from "./hot-remap";
import { requestHotSwap } from "./hot-swap";

/**
 * Flushes the microtask queue so a scheduled swap executes.
 *
 * @returns Promise resolved after pending microtasks ran.
 */
function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

/**
 * Clears process-wide hot state between tests.
 */
function resetHotState(): void {
  const state = getHotState();

  state.latest.clear();
  state.modules.clear();
  state.dirty.clear();
  state.owners.clear();
  state.reloadRequired = false;
  state.scheduled = false;
  state.swapping = false;
}

describe("hot registry", () => {
  beforeEach(() => {
    resetHotState();
  });

  it("should resolve unstamped values to themselves", () => {
    @Injectable()
    class Service {}

    expect(getLatestHotClass(Service)).toBe(Service);
    expect(getLatestHotClass("token")).toBe("token");
    expect(getLatestHotClass(null)).toBeNull();
  });

  it("should resolve stale generations to the newest one", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    @Injectable()
    class ServiceV3 {}

    registerHotModule("services/service.ts", { Service: ServiceV1 });
    expect(getHotState().dirty.size).toBe(0);

    registerHotModule("services/service.ts", { Service: ServiceV2 });
    registerHotModule("services/service.ts", { Service: ServiceV3 });

    expect(getLatestHotClass(ServiceV1)).toBe(ServiceV3);
    expect(getLatestHotClass(ServiceV2)).toBe(ServiceV3);
    expect(getLatestHotClass(ServiceV3)).toBe(ServiceV3);
    expect(getHotState().dirty.has("services/service.ts#Service")).toBe(true);
  });

  it("should ignore non-class module exports", () => {
    registerHotModule("services/service.ts", { value: 42, name: "example" });

    expect(getHotState().latest.size).toBe(0);
  });

  it("should register sealed and frozen classes without modifying them", () => {
    @Injectable()
    class SealedService {}

    @Injectable()
    class FrozenService {}

    Object.seal(SealedService);
    Object.freeze(FrozenService);

    expect(() => registerHotModule("services/locked.ts", { SealedService, FrozenService })).not.toThrow();
    expect(getLatestHotClass(SealedService)).toBe(SealedService);
    expect(getLatestHotClass(FrozenService)).toBe(FrozenService);
  });

  it("should not resolve an unregistered subclass through its registered base", () => {
    @Injectable()
    class BaseV1 {}

    @Injectable()
    class BaseV2 {}

    registerHotModule("base.ts", { Base: BaseV1 });

    // Subclasses declared where the transform does not reach (a .tsx module, a test double)
    // have no direct registry identity and must remain independent from the registered base.
    @Injectable()
    class UntransformedChild extends BaseV1 {}

    registerHotModule("base.ts", { Base: BaseV2 });

    expect(getLatestHotClass(UntransformedChild)).toBe(UntransformedChild);
    expect(new Container({ bindings: [UntransformedChild] }).get(UntransformedChild)).toBeInstanceOf(
      UntransformedChild
    );
  });
});

describe("hot remap", () => {
  beforeEach(() => {
    resetHotState();
  });

  it("should remap bare classes, instance descriptors and class tokens", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });
    registerHotModule("m.ts", { Service: ServiceV2 });

    expect(remapHotBinding(ServiceV1)).toBe(ServiceV2);
    expect(remapHotBinding({ token: ServiceV1, type: "Instance", value: ServiceV1 as Newable<object> })).toEqual({
      token: ServiceV2,
      type: "Instance",
      value: ServiceV2,
    });
    expect(remapHotBinding({ token: ServiceV1, value: "constant" })).toEqual({ token: ServiceV2, value: "constant" });
  });

  it("should keep untouched bindings identical", () => {
    @Injectable()
    class Service {}

    const descriptor = { token: "config", value: { flag: true } };

    expect(remapHotBinding(Service)).toBe(Service);
    expect(remapHotBinding(descriptor)).toBe(descriptor);
  });

  it("should detect outdated configs and remap them", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const config = { bindings: [ServiceV1], activate: [ServiceV1] };

    expect(isHotConfigOutdated(config)).toBe(false);

    registerHotModule("m.ts", { Service: ServiceV2 });

    expect(isHotConfigOutdated(config)).toBe(true);

    const parent: Container = new Container();
    const remapped = remapHotConfig(config, parent);

    expect(remapped.bindings).toEqual([ServiceV2]);
    expect(remapped.activate).toEqual([ServiceV2]);
    expect(remapped.parent).toBe(parent);
  });
});

describe("hot swap", () => {
  beforeEach(() => {
    resetHotState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "location");
  });

  /**
   * Creates an owner over a real managed container, mirroring the React provider contract.
   *
   * @param config - Managed container config.
   * @returns Owner registration with recorded commits and an unregister callback.
   */
  function createOwner(config: Parameters<typeof remapHotConfig>[0]): {
    owner: HotSwapOwner;
    commits: Array<Container>;
    unregister: () => void;
  } {
    const commits: Array<Container> = [];
    const owner: HotSwapOwner = {
      container: new Container({ ...config, activate: config.activate ?? true }).provision(),
      config,
      create: (next) => new Container({ ...next, activate: next.activate ?? true }),
      commit: (container) => commits.push(container),
    };

    return { owner, commits, unregister: registerHotSwapOwner(owner) };
  }

  it("should rebuild only affected containers and run the provision cycle in order", async () => {
    jest.spyOn(console, "info").mockImplementation(() => {});

    const events: Array<string> = [];

    @Injectable()
    class ServiceV1 {
      @OnProvision()
      public onProvision(): void {
        events.push("v1-provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("v1-deprovision");
      }
    }

    @Injectable()
    class ServiceV2 {
      @OnProvision()
      public onProvision(): void {
        events.push("v2-provision");
      }
    }

    @Injectable()
    class UnrelatedService {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const affected = createOwner({ bindings: [ServiceV1] });
    const unaffected = createOwner({ bindings: [UnrelatedService] });
    const previous: Container = affected.owner.container;

    events.length = 0;

    registerHotModule("m.ts", { Service: ServiceV2 });
    requestHotSwap();

    expect(events).toEqual([]);

    await flushMicrotasks();

    // Old instance deprovisioned during teardown, replacement constructed but not provisioned:
    // provisioning belongs to the committing provider, mirroring the ordinary mount path.
    expect(events).toEqual(["v1-deprovision"]);

    expect(affected.commits).toHaveLength(1);
    expect(affected.commits[0]).not.toBe(previous);
    expect(affected.commits[0].get(ServiceV2)).toBeInstanceOf(ServiceV2);
    expect(affected.owner.container).toBe(affected.commits[0]);
    expect(unaffected.commits).toHaveLength(0);

    // Stale references resolve through the newest generation.
    expect(affected.commits[0].get(ServiceV1)).toBe(affected.commits[0].get(ServiceV2));

    expect(previous.hasOwn(ServiceV1)).toBe(false);
    expect(isHotSwapping()).toBe(false);
  });

  it("should reload without tearing down containers when an injectable class is renamed", async () => {
    const reload = jest.fn();

    Object.defineProperty(globalThis, "location", { value: { reload }, configurable: true, writable: true });

    @Injectable()
    class OldService {}

    @Injectable()
    class NewService {}

    registerHotModule("renamed.ts", { OldService });

    const { owner, commits } = createOwner({ bindings: [OldService] });
    const previous: Container = owner.container;

    registerHotModule("renamed.ts", { NewService });
    requestHotSwap();
    await flushMicrotasks();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(commits).toHaveLength(0);
    expect(owner.container).toBe(previous);
    expect(previous.get(OldService)).toBeInstanceOf(OldService);
  });

  it("should reload when one injectable is removed from a module", async () => {
    const reload = jest.fn();

    Object.defineProperty(globalThis, "location", { value: { reload }, configurable: true, writable: true });

    @Injectable()
    class RemovedService {}

    @Injectable()
    class KeptServiceV1 {}

    @Injectable()
    class KeptServiceV2 {}

    registerHotModule("partial.ts", { RemovedService, KeptService: KeptServiceV1 });

    const { owner, commits } = createOwner({ bindings: [RemovedService] });
    const previous: Container = owner.container;

    registerHotModule("partial.ts", { KeptService: KeptServiceV2 });
    requestHotSwap();
    await flushMicrotasks();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(commits).toHaveLength(0);
    expect(owner.container).toBe(previous);
    expect(previous.get(RemovedService)).toBeInstanceOf(RemovedService);
  });

  it("should rebuild descendants of a swapped container with the replacement parent", async () => {
    jest.spyOn(console, "info").mockImplementation(() => {});

    @Injectable()
    class RootServiceV1 {}

    @Injectable()
    class RootServiceV2 {}

    @Injectable()
    class ChildService {
      public constructor(public readonly root: object = inject(RootServiceV1)) {}
    }

    registerHotModule("root.ts", { RootService: RootServiceV1 });

    const root = createOwner({ bindings: [RootServiceV1] });
    const child = createOwner({ bindings: [ChildService], parent: root.owner.container });

    registerHotModule("root.ts", { RootService: RootServiceV2 });
    requestHotSwap();
    await flushMicrotasks();

    expect(root.commits).toHaveLength(1);
    expect(child.commits).toHaveLength(1);
    expect(child.commits[0].parent).toBe(root.commits[0]);

    // The rebuilt child resolves the rebuilt root generation through the stale reference.
    expect(child.commits[0].get(ChildService).root).toBe(root.commits[0].get(RootServiceV2));
  });

  it("should keep containers constructed from stale configs resolvable", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });
    registerHotModule("m.ts", { Service: ServiceV2 });

    // A provider remounting outside the swap path (for example through a user-land key change)
    // constructs straight from a retained config that still references the old generation.
    const container: Container = new Container({ bindings: [ServiceV1] });

    // Bind-time remap keys the binding by the newest generation, so both references resolve.
    expect(container.get(ServiceV1)).toBeInstanceOf(ServiceV2);
    expect(container.get(ServiceV2)).toBe(container.get(ServiceV1));
    expect(container.has(ServiceV1)).toBe(true);
  });

  it("should report a hot swap to teardown handlers, and an ordinary teardown as not one", async () => {
    jest.spyOn(console, "info").mockImplementation(() => {});

    const reasons: Array<string> = [];

    @Injectable()
    class ServiceV1 {
      @OnDeprovision()
      public onDeprovision(): void {
        reasons.push(`deprovision:${isHotSwapping()}`);
      }

      @OnDeactivation()
      public onDeactivation(): void {
        reasons.push(`deactivation:${isHotSwapping()}`);
      }
    }

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const { owner } = createOwner({ bindings: [ServiceV1] });

    registerHotModule("m.ts", { Service: ServiceV2 });
    requestHotSwap();
    await flushMicrotasks();

    // Both teardown phases of a swap run inside the synchronous swap block.
    expect(reasons).toEqual(["deprovision:true", "deactivation:true"]);

    reasons.length = 0;

    // An ordinary teardown of the replacement container reports no swap in progress.
    owner.container.deprovision();
    owner.container.unbindAll();

    expect(reasons.every((reason) => reason.endsWith(":false"))).toBe(true);
    expect(isHotSwapping()).toBe(false);
  });

  it("should fall back to the original token for containers bound before the update", () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    // An external container no provider owns: bound before the update, never swapped.
    const container: Container = new Container({ bindings: [ServiceV1] });

    registerHotModule("m.ts", { Service: ServiceV2 });

    // The newest generation is unbound here, so resolution falls back to the stale binding
    // instead of failing with a missing-binding error.
    expect(container.get(ServiceV1)).toBeInstanceOf(ServiceV1);
    expect(container.has(ServiceV1)).toBe(true);
  });

  it("should not swap after the owner unregisters", async () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const { commits, unregister } = createOwner({ bindings: [ServiceV1] });

    unregister();
    registerHotModule("m.ts", { Service: ServiceV2 });
    requestHotSwap();
    await flushMicrotasks();

    expect(commits).toHaveLength(0);
  });

  it("should not rebuild an already swapped container on a later unrelated update", async () => {
    jest.spyOn(console, "info").mockImplementation(() => {});

    @Injectable()
    class LeftV1 {}

    @Injectable()
    class LeftV2 {}

    @Injectable()
    class RightV1 {}

    @Injectable()
    class RightV2 {}

    registerHotModule("left.ts", { Left: LeftV1 });
    registerHotModule("right.ts", { Right: RightV1 });

    const left = createOwner({ bindings: [LeftV1] });
    const right = createOwner({ bindings: [RightV1] });

    registerHotModule("left.ts", { Left: LeftV2 });
    requestHotSwap();
    await flushMicrotasks();

    expect(left.commits).toHaveLength(1);
    expect(right.commits).toHaveLength(0);

    // The left owner now describes its replacement, so an unrelated update leaves it alone.
    registerHotModule("right.ts", { Right: RightV2 });
    requestHotSwap();
    await flushMicrotasks();

    expect(left.commits).toHaveLength(1);
    expect(right.commits).toHaveLength(1);
  });

  it("should reload the page when a replacement container cannot be built", async () => {
    const error: Error = new Error("binding blew up");

    jest.spyOn(console, "error").mockImplementation(() => {});

    const reload = jest.fn();

    Object.defineProperty(globalThis, "location", { value: { reload }, configurable: true, writable: true });

    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const owner: HotSwapOwner = {
      container: new Container({ bindings: [ServiceV1] }).provision(),
      config: { bindings: [ServiceV1] },
      create: () => {
        throw error;
      },
      commit: () => undefined,
    };

    registerHotSwapOwner(owner);

    registerHotModule("m.ts", { Service: ServiceV2 });
    requestHotSwap();
    await flushMicrotasks();

    // The previous container is already torn down at this point, so the page cannot keep running.
    expect(reload).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Hot swap failed"),
      expect.anything(),
      expect.anything(),
      error
    );

    // The flag must not stay set, or every later render would report a swap in progress.
    expect(isHotSwapping()).toBe(false);
  });

  it("should batch multiple update requests into one swap", async () => {
    jest.spyOn(console, "info").mockImplementation(() => {});

    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("m.ts", { Service: ServiceV1 });

    const { commits } = createOwner({ bindings: [ServiceV1] });

    registerHotModule("m.ts", { Service: ServiceV2 });
    requestHotSwap();
    requestHotSwap();
    requestHotSwap();
    await flushMicrotasks();

    expect(commits).toHaveLength(1);
  });
});
