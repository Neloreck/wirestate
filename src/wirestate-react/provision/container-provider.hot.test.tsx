/**
 * @jest-environment jsdom
 */

import { act, render } from "@testing-library/react";
import { type Container, Injectable, OnDeactivation, OnDeprovision, OnProvision } from "@wirestate/core";
import { registerHotModule } from "@wirestate/core/hot";
import { useEffect, useRef, useState } from "react";

import { useContainer } from "../container/use-container";
import { useInjection } from "../injection/use-injection";

import { ContainerProvider } from "./container-provider";

/**
 * Resets the process-wide hot-reload state between tests through its global anchor,
 * since the registry internals are not part of the public entry.
 */
function resetHotState(): void {
  const state = (
    globalThis as Record<
      symbol,
      {
        latest: Map<string, unknown>;
        modules: Map<string, Set<string>>;
        dirty: Set<string>;
        owners: Set<unknown>;
        reloadRequired: boolean;
        scheduled: boolean;
        swapping: boolean;
      }
    >
  )[Symbol.for("wirestate.hot.state")];

  if (state) {
    state.latest.clear();
    state.modules.clear();
    state.dirty.clear();
    state.owners.clear();
    state.reloadRequired = false;
    state.scheduled = false;
    state.swapping = false;
  }
}

describe("ContainerProvider hot swap", () => {
  beforeEach(() => {
    resetHotState();

    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should swap the managed container in place without remounting consumers", async () => {
    const events: Array<string> = [];

    @Injectable()
    class CounterServiceV1 {
      public readonly label: string = "v1";

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
    class CounterServiceV2 {
      public readonly label: string = "v2";

      @OnProvision()
      public onProvision(): void {
        events.push("v2-provision");
      }
    }

    registerHotModule("services/counter.ts", { CounterService: CounterServiceV1 });

    const containers: Array<Container> = [];
    let mounts: number = 0;

    function Consumer() {
      const container: Container = useContainer();
      // Stale module-scope reference on purpose: consumer modules are not re-executed by
      // a service-only hot update, so resolution must go through the newest generation.
      const service: CounterServiceV1 = useInjection(CounterServiceV1);
      const mounted = useRef(false);

      if (!containers.includes(container)) {
        containers.push(container);
      }

      useEffect(() => {
        if (!mounted.current) {
          mounted.current = true;
          mounts += 1;
        }
      }, []);

      return <span data-testid={"label"}>{service.label}</span>;
    }

    const { getByTestId } = render(
      <ContainerProvider config={{ bindings: [CounterServiceV1] }}>
        <Consumer />
      </ContainerProvider>
    );

    expect(getByTestId("label").textContent).toBe("v1");
    expect(events).toEqual(["v1-provision"]);
    expect(containers).toHaveLength(1);

    events.length = 0;

    // Simulate what the dev-plugin footer does when the service module hot-updates.
    await act(async () => {
      registerHotModule("services/counter.ts", { CounterService: CounterServiceV2 });

      const { requestHotSwap } = await import("@wirestate/core/hot");

      requestHotSwap();
    });

    expect(getByTestId("label").textContent).toBe("v2");
    expect(containers).toHaveLength(2);
    expect(containers[1].get(CounterServiceV1)).toBe(containers[1].get(CounterServiceV2));

    // Old container deprovisioned during the swap, replacement provisioned by the provider effect.
    expect(events).toEqual(["v1-deprovision", "v2-provision"]);

    // The consumer re-rendered against the new container but never remounted.
    expect(mounts).toBe(1);

    // The torn-down container no longer owns the stale binding.
    expect(containers[0].hasOwn(CounterServiceV1)).toBe(false);
  });

  it("should leave a provider alone once its own service stops changing", async () => {
    @Injectable()
    class OwnServiceV1 {}

    @Injectable()
    class OwnServiceV2 {}

    @Injectable()
    class OtherServiceV1 {}

    @Injectable()
    class OtherServiceV2 {}

    registerHotModule("own.ts", { OwnService: OwnServiceV1 });
    registerHotModule("other.ts", { OtherService: OtherServiceV1 });

    const containers: Array<Container> = [];

    function Consumer() {
      const container: Container = useContainer();

      if (!containers.includes(container)) {
        containers.push(container);
      }

      return null;
    }

    render(
      <ContainerProvider config={{ bindings: [OwnServiceV1] }}>
        <Consumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(1);

    const { requestHotSwap } = await import("@wirestate/core/hot");

    await act(async () => {
      registerHotModule("own.ts", { OwnService: OwnServiceV2 });
      requestHotSwap();
    });

    expect(containers).toHaveLength(2);

    // A later update to a service this container never bound must not rebuild it again.
    await act(async () => {
      registerHotModule("other.ts", { OtherService: OtherServiceV2 });
      requestHotSwap();
    });

    expect(containers).toHaveLength(2);
  });

  it("should swap an external container when the application opts in as its owner", async () => {
    const events: Array<string> = [];

    @Injectable()
    class ServiceV1 {
      public readonly label: string = "v1";

      @OnProvision()
      public onProvision(): void {
        events.push("v1-provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("v1-deprovision");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("v1-deactivation");
      }
    }

    @Injectable()
    class ServiceV2 {
      public readonly label: string = "v2";

      @OnProvision()
      public onProvision(): void {
        events.push("v2-provision");
      }
    }

    registerHotModule("services/external.ts", { Service: ServiceV1 });

    const { Container: ContainerClass } = await import("@wirestate/core");
    const { registerHotSwapOwner } = await import("@wirestate/core/hot");

    const config = { bindings: [ServiceV1], activate: true };
    // Simulates a module-level container created before React mounts.
    const bootstrapped: Container = new ContainerClass(config);

    function Consumer() {
      const service: ServiceV1 = useInjection(ServiceV1);

      return <span data-testid={"label"}>{service.label}</span>;
    }

    // The application owns the container, so it registers itself as the hot-swap owner and
    // commits replacements into React state.
    function ExternalProvider() {
      const [container, setContainer] = useState<Container>(bootstrapped);

      useEffect(
        () =>
          registerHotSwapOwner({
            container,
            config,
            create: (next) => new ContainerClass(next),
            commit: setContainer,
          }),
        [container]
      );

      return (
        <ContainerProvider container={container}>
          <Consumer />
        </ContainerProvider>
      );
    }

    const { getByTestId } = render(<ExternalProvider />);

    expect(getByTestId("label").textContent).toBe("v1");
    events.length = 0;

    await act(async () => {
      registerHotModule("services/external.ts", { Service: ServiceV2 });

      const { requestHotSwap } = await import("@wirestate/core/hot");

      requestHotSwap();
    });

    expect(getByTestId("label").textContent).toBe("v2");

    // Opting in gives the external container the full teardown an owned one gets,
    // including deactivation, which the provider alone would never run.
    expect(events).toEqual(["v1-deprovision", "v1-deactivation", "v2-provision"]);
    expect(bootstrapped.hasOwn(ServiceV1)).toBe(false);
    expect(bootstrapped.getActiveInstances()).toHaveLength(0);
  });

  it("should ignore hot updates for external containers", async () => {
    @Injectable()
    class ServiceV1 {}

    @Injectable()
    class ServiceV2 {}

    registerHotModule("services/service.ts", { Service: ServiceV1 });

    const containers: Array<Container> = [];

    function Consumer() {
      const container: Container = useContainer();

      if (!containers.includes(container)) {
        containers.push(container);
      }

      return null;
    }

    const { Container: ContainerClass } = await import("@wirestate/core");
    const external = new ContainerClass({ bindings: [ServiceV1] });

    render(
      <ContainerProvider container={external}>
        <Consumer />
      </ContainerProvider>
    );

    await act(async () => {
      registerHotModule("services/service.ts", { Service: ServiceV2 });

      const { requestHotSwap } = await import("@wirestate/core/hot");

      requestHotSwap();
    });

    // External containers are not owned by the provider and are never swapped.
    expect(containers).toEqual([external]);
    expect(external.hasOwn(ServiceV1)).toBe(true);
  });
});
