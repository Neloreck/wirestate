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
import { StrictMode } from "react";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { useContainer } from "../context/use-container";
import { useInjection } from "../injection/use-injection";
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
    const staleContainer: Container = containers[1];
    const secondContainer: Container = containers[2];

    expect(getByTestId("value").textContent).toBe("second");
    expect(containers).toHaveLength(3);
    expect(staleContainer).toBe(firstContainer);
    expect(secondContainer).not.toBe(firstContainer);
  });

  it("should recreate child container when parent container changes with same entries", async () => {
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
    const staleChildContainer: Container = containers[1];
    const secondChildContainer: Container = containers[2];

    expect(containers).toHaveLength(3);
    expect(staleChildContainer).toBe(firstChildContainer);
    expect(secondChildContainer).not.toBe(firstChildContainer);
    expect(getByTestId("value").textContent).toBe("stable|second-parent");
    expect(secondChildContainer.get(PARENT_TOKEN)).toBe("second-parent");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["activate", "activate", "deactivate"]);
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
});

describe("SubContainerProvider lifecycle", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";

  it("should provision and deprovision decorated child services when replacement commits", async () => {
    const parentContainer: Container = mockContainer();
    const { lifecycleEvents, LifecycleService } = createLifecycleService(["deactivation", "provision", "deprovision"]);

    function Consumer() {
      const config: string = useInjection(CONFIG_TOKEN);

      return <span data-testid={"value"}>{config}</span>;
    }

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "first" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(lifecycleEvents).toEqual(["provision"]);

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "second" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(lifecycleEvents).toEqual(["provision", "deprovision", "provision"]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["provision", "deprovision", "provision", "deactivation"]);
  });

  it("should not provision the same child container twice on stable rerender", () => {
    const parentContainer: Container = mockContainer();
    const entry = { id: CONFIG_TOKEN, value: "stable" };

    const { lifecycleEvents, LifecycleService } = createLifecycleService(["provision", "deprovision"]);

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, entry]} />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, entry]} />
      </ContainerProvider>
    );

    expect(lifecycleEvents).toEqual(["provision"]);
  });

  it("should dispose previous container when replacement commits", async () => {
    const parentContainer: Container = mockContainer();
    const { lifecycleEvents, LifecycleService } = createLifecycleService(["activated", "deactivation"]);

    function Consumer() {
      const config: string = useInjection(CONFIG_TOKEN);

      return <span data-testid={"value"}>{config}</span>;
    }

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "first" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "second" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "third" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["activated", "activated", "deactivation", "activated", "deactivation"]);
  });

  it("should have predicted lifecycle order in normal mode", async () => {
    const parentContainer: Container = mockContainer();
    const { lifecycleEvents, LifecycleService } = createLifecycleService();

    function Consumer() {
      const config: string = useInjection(CONFIG_TOKEN);

      return <span data-testid={"value"}>{config}</span>;
    }

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "first" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(lifecycleEvents).toEqual(["activated", "provision"]);

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "second" }]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
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
    const parentContainer: Container = mockContainer();
    const { lifecycleEvents, LifecycleService } = createLifecycleService();

    function Consumer() {
      const config: string = useInjection(CONFIG_TOKEN);

      return <span data-testid={"value"}>{config}</span>;
    }

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider container={parentContainer}>
          <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "first" }]}>
            <Consumer />
          </SubContainerProvider>
        </ContainerProvider>
      </StrictMode>
    );

    expect(lifecycleEvents).toEqual(["activated", "provision", "deprovision", "provision"]);

    rerender(
      <StrictMode>
        <ContainerProvider container={parentContainer}>
          <SubContainerProvider entries={[LifecycleService, { id: CONFIG_TOKEN, value: "second" }]}>
            <Consumer />
          </SubContainerProvider>
        </ContainerProvider>
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
