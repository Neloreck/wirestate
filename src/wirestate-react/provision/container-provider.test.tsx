import { render } from "@testing-library/react";
import { BindingType, Container, ContainerConfig, createContainer } from "@wirestate/core";
import { StrictMode } from "react";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { useContainer } from "../context/use-container";
import { useInjection } from "../injection/use-injection";
import { AnyObject } from "../types/general";

import { ContainerProvider } from "./container-provider";

describe("ContainerProvider", () => {
  function Consumer() {
    const container: Container = useContainer();

    return (
      <div>
        <span data-testid={"container-id"}>{(container as AnyObject).id ?? "?"}</span>
      </div>
    );
  }

  beforeEach(() => {
    jest.spyOn(window.console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should use the provided external container", () => {
    const container: Container = new Container();

    (container as AnyObject).id = "external-id";

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <Consumer />
      </ContainerProvider>
    );

    expect(getByTestId("container-id").textContent).toBe("external-id");
  });

  it("should require external container or managed config", () => {
    expect(() => render(<ContainerProvider />)).toThrow(
      "ContainerProvider requires a valid container instance or creation config."
    );
  });

  it("should reject mixed external container and managed config", () => {
    expect(() => render(<ContainerProvider container={new Container()} config={{}} />)).toThrow(
      "ContainerProvider requires only container or valid config object to be provided."
    );
  });

  it("should reject invalid managed config values", () => {
    for (const config of ["bad", null, []]) {
      expect(() => render(<ContainerProvider config={config as ContainerConfig} />)).toThrow(
        "ContainerProvider requires a valid container instance or creation config."
      );
    }
  });

  it("should recreate managed container when bindings change", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();
      const value: string = useInjection(CONFIG_TOKEN);

      containers.push(container);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "first" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first");

    rerender(
      <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "second" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).not.toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("second");
  });

  it("should keep managed container when bindings are shallow-equal", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const binding = { token: CONFIG_TOKEN, value: "stable" };
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();
      const value: string = useInjection(CONFIG_TOKEN);

      containers.push(container);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider config={{ bindings: [binding] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider config={{ bindings: [binding] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("stable");
  });

  it("should recreate managed container when parent changes", () => {
    const PARENT_TOKEN: string = "PARENT_TOKEN";
    const firstParent: Container = new Container();
    const secondParent: Container = new Container();
    const containers: Array<Container> = [];

    firstParent.bind(PARENT_TOKEN).toConstantValue("first-parent");
    secondParent.bind(PARENT_TOKEN).toConstantValue("second-parent");

    function TrackingConsumer() {
      const container: Container = useContainer();
      const value: string = useInjection(PARENT_TOKEN);

      containers.push(container);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider config={{ parent: firstParent }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first-parent");

    rerender(
      <ContainerProvider config={{ parent: secondParent }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).not.toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("second-parent");
  });

  it("should recreate managed container when activate changes", () => {
    const { LifecycleService, events } = createLifecycleService({ methods: ["activated"] });

    const { rerender } = render(<ContainerProvider config={{ bindings: [LifecycleService], activate: false }} />);

    expect(events).toEqual(["activated"]);

    rerender(<ContainerProvider config={{ bindings: [LifecycleService], activate: true }} />);

    expect(events).toEqual(["activated", "activated"]);
  });

  it("should recreate managed container when seed changes", () => {
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      containers.push(useContainer());

      return null;
    }

    const { rerender } = render(
      <ContainerProvider config={{ seed: { value: "first" } }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider config={{ seed: { value: "second" } }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).not.toBe(containers[0]);
  });

  it("should dispose previous managed container when replacement commits", async () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      containers.push(useContainer());

      return null;
    }

    const { rerender } = render(
      <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "first" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "second" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(containers[0].isCurrentBound(CONFIG_TOKEN)).toBe(false);
    expect(containers).toHaveLength(2);
  });

  it("should dispose previous managed container when replacement commits in strict mode", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      containers.push(useContainer());

      return null;
    }

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "first" }] }}>
          <TrackingConsumer />
        </ContainerProvider>
      </StrictMode>
    );

    rerender(
      <StrictMode>
        <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "second" }] }}>
          <TrackingConsumer />
        </ContainerProvider>
      </StrictMode>
    );

    expect(containers).toHaveLength(4);

    expect(containers[0]).toBe(containers[1]);
    expect(containers[2]).toBe(containers[3]);
    expect(containers[2]).not.toBe(containers[0]);
  });

  it("should recreate managed container with strict mode", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";

    function TrackingConsumer() {
      const value: string = useInjection(CONFIG_TOKEN);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId } = render(
      <StrictMode>
        <ContainerProvider config={{ bindings: [{ token: CONFIG_TOKEN, value: "strict" }] }}>
          <TrackingConsumer />
        </ContainerProvider>
      </StrictMode>
    );

    expect(getByTestId("value").textContent).toBe("strict");
  });
});

describe("ContainerProvider lifecycle", () => {
  it("should call provider lifecycle for instance descriptors bound behind custom tokens", () => {
    const TOKEN: unique symbol = Symbol("lifecycle-service");
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const { unmount } = render(
      <ContainerProvider
        config={{
          bindings: [
            {
              type: BindingType.Instance,
              token: TOKEN,
              value: LifecycleService,
            },
          ],
        }}
      />
    );

    expect(events).toEqual(["provision"]);

    unmount();

    expect(events).toEqual(["provision", "deprovision"]);
  });

  it("should call provision lifecycle for external container without disposing it", async () => {
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = createContainer({ bindings: [LifecycleService] });
    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    const { unmount } = render(<ContainerProvider container={container} />);

    expect(events).toEqual(["activated", "provision"]);

    unmount();

    expect(events).toEqual(["activated", "provision", "deprovision"]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual(["activated", "provision", "deprovision"]);
    expect(unbindAllSpy).not.toHaveBeenCalled();
    expect(container.isBound(LifecycleService)).toBe(true);
  });

  it("should not provision the same external container twice on stable rerender", () => {
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });
    const container: Container = createContainer({ bindings: [LifecycleService] });

    const { rerender, unmount } = render(<ContainerProvider container={container} />);

    for (let it = 0; it < 10; it++) {
      rerender(<ContainerProvider container={container} />);
    }

    expect(events).toEqual(["provision"]);

    unmount();

    expect(events).toEqual(["provision", "deprovision"]);
  });

  it("should deprovision previous external container when container changes", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstLifecycleService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondLifecycleService } = createLifecycleService({ events, suffix: "second" });

    const { rerender } = render(
      <ContainerProvider container={createContainer({ bindings: [FirstLifecycleService] })} />
    );

    expect(events).toEqual(["activated-first", "provision-first"]);

    rerender(<ContainerProvider container={createContainer({ bindings: [SecondLifecycleService] })} />);

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "activated-second",
      "provision-second",
    ]);
  });

  it("should call expected lifecycle on regular mount", () => {
    const { LifecycleService, events } = createLifecycleService();

    render(
      <ContainerProvider
        config={{
          bindings: [LifecycleService],
        }}
      />
    );

    expect(events).toEqual(["activated", "provision"]);
  });

  it("should not provision the same managed container twice on stable rerender", async () => {
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const { rerender } = render(
      <ContainerProvider
        config={{
          bindings: [LifecycleService],
        }}
      />
    );

    for (let it = 0; it < 10; it++) {
      rerender(
        <ContainerProvider
          config={{
            bindings: [LifecycleService],
          }}
        />
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual(["provision"]);
  });

  it("should have predicted lifecycle order in normal mode", async () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstLifecycleService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondLifecycleService } = createLifecycleService({ events, suffix: "second" });

    const { rerender } = render(
      <ContainerProvider
        config={{
          bindings: [FirstLifecycleService],
        }}
      />
    );

    expect(events).toEqual(["activated-first", "provision-first"]);

    rerender(
      <ContainerProvider
        config={{
          bindings: [SecondLifecycleService],
        }}
      />
    );

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "activated-second",
      "deprovision-first",
      "provision-second",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "activated-second",
      "deprovision-first",
      "provision-second",
      "deactivation-first",
    ]);
  });

  it("should have predicted lifecycle order in strict mode", async () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstLifecycleService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondLifecycleService } = createLifecycleService({ events, suffix: "second" });

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider
          config={{
            bindings: [FirstLifecycleService],
          }}
        />
      </StrictMode>
    );

    expect(events).toEqual([
      "activated-first",
      "activated-first",
      "provision-first",
      "deprovision-first",
      "provision-first",
    ]);

    rerender(
      <StrictMode>
        <ContainerProvider
          config={{
            bindings: [SecondLifecycleService],
          }}
        />
      </StrictMode>
    );

    expect(events).toEqual([
      "activated-first",
      "activated-first",
      "provision-first",
      "deprovision-first",
      "provision-first",
      "activated-second",
      "deprovision-first",
      "provision-second",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toEqual([
      "activated-first", // [strict mode] Additional creation, dropped right after construction.
      "activated-first",
      "provision-first", // [strict mode] Strict mode cycle to shake off side effects.
      "deprovision-first", // [strict mode] Strict mode cycle to shake off side effects.
      "provision-first",
      "activated-second",
      "deprovision-first",
      "provision-second",
      "deactivation-first",
    ]);
  });
});
