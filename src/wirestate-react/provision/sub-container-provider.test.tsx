import { render } from "@testing-library/react";
import {
  BindingType,
  CommandBus,
  Container,
  EventBus,
  Injectable,
  OnActivated,
  OnDeactivation,
  QueryBus,
  WireScope,
} from "@wirestate/core";
import { mockBind, mockContainer } from "@wirestate/core/test-utils";
import { StrictMode } from "react";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

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
          bindings={[
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

  it("should provide child container with bound bindings", () => {
    function Consumer() {
      const container: Container = useContainer();

      return <span data-testid={"value"}>{container.get<string>(CONFIG_TOKEN)}</span>;
    }

    const parentContainer: Container = mockContainer();

    mockBind(parentContainer, {
      id: CONFIG_TOKEN,
      value: "parent-value",
    });

    const { getByTestId, rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider
          bindings={[
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

  it("should recreate child container when bindings change", () => {
    const parentContainer: Container = mockContainer();
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();

      containers.push(container);

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { rerender, getByTestId } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[{ id: CONFIG_TOKEN, value: "first" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("first");

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[{ id: CONFIG_TOKEN, value: "second" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("second");
    expect(containers).toHaveLength(2);
    expect(containers[0]).not.toBe(containers[1]);
  });

  it("should recreate child container when parent container changes with same bindings", async () => {
    const PARENT_TOKEN: string = "PARENT_TOKEN";
    const firstParent: Container = mockContainer();
    const secondParent: Container = mockContainer();
    const containers: Array<Container> = [];
    const lifecycleEvents: Array<string> = [];

    mockBind(firstParent, { id: PARENT_TOKEN, value: "first-parent" });
    mockBind(secondParent, { id: PARENT_TOKEN, value: "second-parent" });

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
        <SubContainerProvider bindings={[LifecycleService, { id: CONFIG_TOKEN, value: "stable" }]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(getByTestId("value").textContent).toBe("stable|first-parent");

    rerender(
      <ContainerProvider container={secondParent}>
        <SubContainerProvider bindings={[LifecycleService, { id: CONFIG_TOKEN, value: "stable" }]}>
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
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lifecycleEvents).toEqual(["activate", "activate", "deactivate"]);
  });

  it("should keep child container when bindings are shallow-equal", () => {
    const parentContainer: Container = mockContainer();
    const binding = { id: CONFIG_TOKEN, value: "stable" };
    const containers: Array<Container> = [];

    function TrackingConsumer() {
      const container: Container = useContainer();

      containers.push(container);

      return <span data-testid={"value"}>{container.get(CONFIG_TOKEN)}</span>;
    }

    const { rerender, getByTestId } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[binding]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[binding]}>
          <TrackingConsumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(containers).toHaveLength(2);
    expect(containers[1]).toBe(containers[0]);
    expect(getByTestId("value").textContent).toBe("stable");
  });

  it("should recreate child container when activate changes", () => {
    const parentContainer: Container = mockContainer();
    const { LifecycleService, events } = createLifecycleService({ methods: ["activated"] });

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[LifecycleService]} activate={false} />
      </ContainerProvider>
    );

    expect(events).toEqual(["activated"]);

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[LifecycleService]} activate={true} />
      </ContainerProvider>
    );

    expect(events).toEqual(["activated", "activated"]);
  });
});

describe("SubContainerProvider lifecycle", () => {
  it("should call provider lifecycle for instance descriptors bound behind custom tokens", () => {
    const parentContainer: Container = mockContainer();
    const TOKEN: unique symbol = Symbol("lifecycle-service");
    const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const { unmount } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider
          bindings={[
            {
              bindingType: BindingType.Instance,
              id: TOKEN,
              value: LifecycleService,
            },
          ]}
        />
      </ContainerProvider>
    );

    expect(LifecycleService.EVENTS).toEqual(["provision"]);

    unmount();

    expect(LifecycleService.EVENTS).toEqual(["provision", "deprovision"]);
  });

  it("should call expected lifecycle on regular mount", () => {
    const { LifecycleService } = createLifecycleService();

    render(
      <ContainerProvider container={mockContainer()}>
        <SubContainerProvider bindings={[LifecycleService]} />
      </ContainerProvider>
    );

    expect(LifecycleService.EVENTS).toEqual(["activated", "provision"]);
  });

  it("should preserve external parent lifecycle while provisioning child container", async () => {
    const events: Array<string> = [];
    const { LifecycleService: ParentLifecycleService } = createLifecycleService({ events, suffix: "parent" });
    const { LifecycleService: ChildLifecycleService } = createLifecycleService({ events, suffix: "child" });
    const parentContainer: Container = mockContainer({ bindings: [ParentLifecycleService], activate: true });
    const unbindAllSpy = jest.spyOn(parentContainer, "unbindAll");

    const { unmount } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[ChildLifecycleService]} />
      </ContainerProvider>
    );

    expect(events).toEqual(["activated-parent", "activated-child", "provision-child", "provision-parent"]);

    unmount();

    expect(events).toEqual([
      "activated-parent",
      "activated-child",
      "provision-child",
      "provision-parent",
      "deprovision-parent",
      "deprovision-child",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual([
      "activated-parent",
      "activated-child",
      "provision-child",
      "provision-parent",
      "deprovision-parent",
      "deprovision-child",
      "deactivation-child",
    ]);

    expect(unbindAllSpy).not.toHaveBeenCalled();
  });

  it("should not provision the same child container twice on stable rerender", () => {
    const parentContainer: Container = mockContainer();
    const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[LifecycleService]} />
      </ContainerProvider>
    );

    for (let it = 0; it < 10; it++) {
      rerender(
        <ContainerProvider container={parentContainer}>
          <SubContainerProvider bindings={[LifecycleService]} />
        </ContainerProvider>
      );
    }

    expect(events).toEqual(["provision"]);
  });

  it("should have predicted lifecycle order in normal mode", async () => {
    const parentContainer: Container = mockContainer();
    const events: Array<string> = [];
    const { LifecycleService: FirstLifecycleService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondLifecycleService } = createLifecycleService({ events, suffix: "second" });

    const { rerender } = render(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[FirstLifecycleService]} />
      </ContainerProvider>
    );

    expect(events).toEqual(["activated-first", "provision-first"]);

    rerender(
      <ContainerProvider container={parentContainer}>
        <SubContainerProvider bindings={[SecondLifecycleService]} />
      </ContainerProvider>
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
    const parentContainer: Container = mockContainer();
    const events: Array<string> = [];
    const { LifecycleService: FirstLifecycleService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondLifecycleService } = createLifecycleService({ events, suffix: "second" });

    const { rerender } = render(
      <StrictMode>
        <ContainerProvider container={parentContainer}>
          <SubContainerProvider bindings={[FirstLifecycleService]} />
        </ContainerProvider>
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
        <ContainerProvider container={parentContainer}>
          <SubContainerProvider bindings={[SecondLifecycleService]} />
        </ContainerProvider>
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
