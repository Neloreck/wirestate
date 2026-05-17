import { render } from "@testing-library/react";
import {
  CommandBus,
  Container,
  EventBus,
  Injectable,
  OnActivated,
  OnDeactivation,
  QueryBus,
  WireScope,
} from "@wirestate/core";
import { mockBindEntry, mockContainer } from "@wirestate/core/test-utils";

import { useContainer } from "../context/use-container";
import { Optional } from "../types/general";

import { ContainerProvider } from "./container-provider";
import { SubContainerProvider } from "./sub-container-provider";

describe("SubContainerProvider", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";

  it("should create child container with correct parent context", () => {
    const parentContainer: Container = mockContainer();
    let childContainer: Optional<Container> = null as Optional<Container>;

    function Consumer() {
      const container: Container = useContainer();

      childContainer = container;

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider
          entries={[
            {
              id: CONFIG_TOKEN,
              value: "child-value",
            },
          ]}
        >
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("child-value");
    expect(childContainer).toBeInstanceOf(Container);
    expect(parentContainer.isBound(CONFIG_TOKEN)).toBe(false);
    expect(childContainer?.isBound(CONFIG_TOKEN)).toBe(true);

    expect(childContainer?.isBound(WireScope)).toBe(true);
    expect(childContainer?.isBound(EventBus)).toBe(true);
    expect(childContainer?.isBound(QueryBus)).toBe(true);
    expect(childContainer?.isBound(CommandBus)).toBe(true);
  });

  it("should provide child container with bound entries", () => {
    function Consumer() {
      const container: Container = useContainer();

      return <span data-testid={"value"}>{container.get<string>(CONFIG_TOKEN)}</span>;
    }

    const parentContainer: Container = mockContainer();

    mockBindEntry(parentContainer, {
      id: CONFIG_TOKEN,
      value: "parent-value",
    });

    const { getByTestId, rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider
          entries={[
            {
              id: CONFIG_TOKEN,
              value: "child-value",
            },
          ]}
        >
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("child-value");

    rerender(
      <ContainerProvider container={parentContainer}>
        <Consumer />
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("parent-value");
  });

  it("should recreate child container when entries change", () => {
    const parentContainer: Container = mockContainer();
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();

      containers.push(container);

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { rerender, getByTestId } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[{ id: CONFIG_TOKEN, value: "first" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first");

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[{ id: CONFIG_TOKEN, value: "second" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    const firstContainer: Container = containers[0];
    const secondContainer: Container = containers[1];

    expect(getByTestId("value").textContent).toBe("second");
    expect(containers).toHaveLength(2);
    expect(secondContainer).not.toBe(firstContainer);
  });

  it("should recreate child container when parent container changes with same entries", () => {
    const PARENT_TOKEN: string = "PARENT_TOKEN";
    const firstParent: Container = mockContainer();
    const secondParent: Container = mockContainer();
    const containers: Array<Container> = [];
    const lifecycleEvents: Array<string> = [];

    mockBindEntry(firstParent, { id: PARENT_TOKEN, value: "first-parent" });
    mockBindEntry(secondParent, { id: PARENT_TOKEN, value: "second-parent" });

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

    function TrackingConsumer() {
      const container: Container = useContainer();

      containers.push(container);
      container.get(LifecycleService);

      return (
        <span data-testid={"value"}>
          {container.get(CONFIG_TOKEN)}|{container.get(PARENT_TOKEN)}
        </span>
      );
    }

    const { rerender, getByTestId } = render(
      <ContainerProvider container={firstParent}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "stable" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("stable|first-parent");

    rerender(
      <ContainerProvider container={secondParent}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "stable" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    const firstChildContainer: Container = containers[0];
    const secondChildContainer: Container = containers[1];

    expect(containers).toHaveLength(2);
    expect(secondChildContainer).not.toBe(firstChildContainer);
    expect(getByTestId("value").textContent).toBe("stable|second-parent");
    expect(secondChildContainer.get(PARENT_TOKEN)).toBe("second-parent");
    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);
  });

  it("should keep child container when entries are shallow-equal", () => {
    const parentContainer: Container = mockContainer();
    const entry = { id: CONFIG_TOKEN, value: "stable" };
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();

      containers.push(container);

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { rerender, getByTestId } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[entry]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[entry]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("stable");
  });

  it("should dispose previous container before activating next instance", () => {
    const parentContainer: Container = mockContainer();
    const lifecycleEvents: Array<string> = [];

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

    function Consumer() {
      const container: Container = useContainer();

      container.get(LifecycleService);

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "first" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "second" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "third" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate", "deactivate", "activate"]);
  });
});
