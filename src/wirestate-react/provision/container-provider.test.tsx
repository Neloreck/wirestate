import { render } from "@testing-library/react";
import { Container, Injectable, OnActivated, OnDeactivation } from "@wirestate/core";
import { StrictMode } from "react";

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

  it("should dispose previous managed container before activating replacement", () => {
    const lifecycleEvents: Array<string> = [];
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";

    @Injectable()
    class LifecycleService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("activate");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycleEvents.push("deactivate");
      }
    }

    const { rerender } = render(
      <ContainerProvider
        container={{
          activate: [LifecycleService],
          entries: [LifecycleService],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activate"]);

    rerender(
      <ContainerProvider
        container={{
          activate: [LifecycleService],
          entries: [LifecycleService, { id: CONFIG_TOKEN, value: "next" }],
        }}
      />
    );

    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);
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
