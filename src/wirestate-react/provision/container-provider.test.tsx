import { render } from "@testing-library/react";
import { Container, createContainer } from "@wirestate/core";
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

  it("should recreate managed container when entries change", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();
      const value: string = useInjection(CONFIG_TOKEN);

      containers.push(container);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "first" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first");

    rerender(
      <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "second" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).not.toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("second");
  });

  it("should keep managed container when entries are shallow-equal", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const entry = { id: CONFIG_TOKEN, value: "stable" };
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();
      const value: string = useInjection(CONFIG_TOKEN);

      containers.push(container);

      return <span data-testid={"value"}>{value}</span>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider container={{ entries: [entry] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={{ entries: [entry] }}>
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
      <ContainerProvider container={{ parent: firstParent }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first-parent");

    rerender(
      <ContainerProvider container={{ parent: secondParent }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).not.toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("second-parent");
  });

  it("should dispose previous managed container when replacement commits", async () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      containers.push(useContainer());

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "first" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    const unbindAllSpy = jest.spyOn(containers[0], "unbindAll");

    rerender(
      <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "second" }] }}>
        <TrackingConsumer />
      </ContainerProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unbindAllSpy).toHaveBeenCalledTimes(1);
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
        <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "first" }] }}>
          <TrackingConsumer />
        </ContainerProvider>
      </StrictMode>
    );

    rerender(
      <StrictMode>
        <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "second" }] }}>
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
        <ContainerProvider container={{ entries: [{ id: CONFIG_TOKEN, value: "strict" }] }}>
          <TrackingConsumer />
        </ContainerProvider>
      </StrictMode>
    );

    expect(getByTestId("value").textContent).toBe("strict");
  });
});

describe("ContainerProvider lifecycle", () => {
  it("should call provision lifecycle for external container without disposing it", async () => {
    const LifecycleService = createLifecycleService();
    const container: Container = createContainer({ entries: [LifecycleService] });
    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    const { unmount } = render(<ContainerProvider container={container} />);

    expect(LifecycleService.EVENTS).toEqual(["activated", "provision"]);

    unmount();

    expect(LifecycleService.EVENTS).toEqual(["activated", "provision", "deprovision"]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(LifecycleService.EVENTS).toEqual(["activated", "provision", "deprovision"]);
    expect(unbindAllSpy).not.toHaveBeenCalled();
    expect(container.isBound(LifecycleService)).toBe(true);
  });

  it("should not provision the same external container twice on stable rerender", () => {
    const LifecycleService = createLifecycleService({ methods: ["provision", "deprovision"] });
    const container: Container = createContainer({ entries: [LifecycleService] });

    const { rerender, unmount } = render(<ContainerProvider container={container} />);

    for (let it = 0; it < 10; it++) {
      rerender(<ContainerProvider container={container} />);
    }

    expect(LifecycleService.EVENTS).toEqual(["provision"]);

    unmount();

    expect(LifecycleService.EVENTS).toEqual(["provision", "deprovision"]);
  });

  it("should deprovision previous external container when container changes", () => {
    const events: Array<string> = [];
    const FirstLifecycleService = createLifecycleService({ events, suffix: "first" });
    const SecondLifecycleService = createLifecycleService({ events, suffix: "second" });
    const firstContainer: Container = createContainer({ entries: [FirstLifecycleService] });
    const secondContainer: Container = createContainer({ entries: [SecondLifecycleService] });

    const { rerender } = render(<ContainerProvider container={firstContainer} />);

    expect(events).toEqual(["activated-first", "provision-first"]);

    rerender(<ContainerProvider container={secondContainer} />);

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "activated-second",
      "provision-second",
    ]);
  });

  it("should call expected lifecycle on regular mount", () => {
    const LifecycleService = createLifecycleService();

    render(
      <ContainerProvider
        container={{
          entries: [LifecycleService],
        }}
      />
    );

    expect(LifecycleService.EVENTS).toEqual(["activated", "provision"]);
  });

  it("should not provision the same managed container twice on stable rerender", async () => {
    const LifecycleService = createLifecycleService({ methods: ["provision", "deprovision"] });

    const { rerender } = render(
      <ContainerProvider
        container={{
          entries: [LifecycleService],
        }}
      />
    );

    for (let it = 0; it < 10; it++) {
      rerender(
        <ContainerProvider
          container={{
            entries: [LifecycleService],
          }}
        />
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(LifecycleService.EVENTS).toEqual(["provision"]);
  });

  it("should have predicted lifecycle order in normal mode", async () => {
    const events: Array<string> = [];

    const { rerender } = render(
      <ContainerProvider
        container={{
          entries: [createLifecycleService({ events, suffix: "first" })],
        }}
      />
    );

    expect(events).toEqual(["activated-first", "provision-first"]);

    rerender(
      <ContainerProvider
        container={{
          entries: [createLifecycleService({ events, suffix: "second" })],
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

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider
          container={{
            entries: [createLifecycleService({ events, suffix: "first" })],
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
          container={{
            entries: [createLifecycleService({ events, suffix: "second" })],
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
