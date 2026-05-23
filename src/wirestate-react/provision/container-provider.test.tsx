import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";
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

    expect(containers).toHaveLength(3);
    expect(containers[1]).toBe(containers[0]);
    expect(containers[2]).not.toBe(containers[0]);
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

    expect(containers).toHaveLength(3);
    expect(containers[1]).toBe(containers[0]);
    expect(containers[2]).not.toBe(containers[0]);
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
    expect(containers).toHaveLength(3);
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

    expect(containers).toHaveLength(6);

    expect(containers[0]).toBe(containers[1]);
    expect(containers[2]).toBe(containers[3]);
    expect(containers[4]).toBe(containers[5]);
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
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";

  it("should call expected lifecycle on regular mount", () => {
    const { lifecycleEvents, LifecycleService } = createLifecycleService();

    render(
      <ContainerProvider
        container={{
          entries: [LifecycleService],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activated", "provision"]);
  });

  it("should activate replacement before disposing previous managed container", async () => {
    const { lifecycleEvents, LifecycleService } = createLifecycleService(["activated", "deactivation"]);

    const { rerender } = render(
      <ContainerProvider
        container={{
          activate: [LifecycleService],
          entries: [LifecycleService],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activated"]);

    rerender(
      <ContainerProvider
        container={{
          activate: [LifecycleService],
          entries: [LifecycleService, { id: CONFIG_TOKEN, value: "next" }],
        }}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["activated", "activated", "deactivation"]);
  });

  it("should not provision the same managed container twice on stable rerender", async () => {
    const { lifecycleEvents, LifecycleService } = createLifecycleService(["provision", "deprovision"]);
    const entry = { id: CONFIG_TOKEN, value: "stable" };

    const { rerender } = render(
      <ContainerProvider
        container={{
          entries: [LifecycleService, entry],
        }}
      />
    );

    for (let it = 0; it < 10; it++) {
      rerender(
        <ContainerProvider
          container={{
            entries: [LifecycleService, entry],
          }}
        />
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["provision"]);
  });

  it("should have predicted lifecycle order in normal mode", async () => {
    const { lifecycleEvents, LifecycleService } = createLifecycleService();

    const { rerender } = render(
      <ContainerProvider
        container={{
          entries: [LifecycleService],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activated", "provision"]);

    rerender(
      <ContainerProvider
        container={{
          entries: [LifecycleService, { id: CONFIG_TOKEN, value: "next" }],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activated", "provision", "deprovision", "activated", "provision"]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual([
      "activated",
      "provision",
      "deprovision",
      "activated",
      "provision",
      "deactivation",
    ]);
  });

  it("should have predicted lifecycle order in strict mode", async () => {
    const { lifecycleEvents, LifecycleService } = createLifecycleService();

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider
          container={{
            entries: [LifecycleService],
          }}
        />
      </StrictMode>
    );

    expect(lifecycleEvents).toEqual(["activated", "provision", "deprovision", "provision"]);

    rerender(
      <StrictMode>
        <ContainerProvider
          container={{
            entries: [LifecycleService, { id: CONFIG_TOKEN, value: "next" }],
          }}
        />
      </StrictMode>
    );

    expect(lifecycleEvents).toEqual([
      "activated",
      "provision",
      "deprovision",
      "provision",
      "deprovision",
      "activated",
      "provision",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual([
      "activated",
      "provision",
      "deprovision",
      "provision",
      "deprovision",
      "activated",
      "provision",
      "deactivation",
    ]);
  });
});
