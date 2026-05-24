import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { BindingType, Container, createContainer, Injectable, OnActivated, OnDeactivation } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";
import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { ContainerProvider } from "./container-provider";

describe("ContainerProvider", () => {
  @customElement("ws-container-provider-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-container-provider-child")
  class TestChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should use the provided container", () => {
    const element: TestProviderElement = new TestProviderElement();
    const container: Container = mockContainer();
    const controller: ContainerProvider = new ContainerProvider(element, {
      container: container,
    });

    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value).toBe(container);

    element.remove();

    expect(controller.value).toBeUndefined();
  });

  it("should provide container to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const container: Container = mockContainer();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProvider = new ContainerProvider(element, {
      container,
    });

    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    let receivedContext: Maybe<Container>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(receivedContext).toBeDefined();
    expect(receivedContext).toBe(controller.value);
    expect(receivedContext).toBe(container);

    element.remove();

    expect(controller.value).toBeUndefined();
  });

  it("should propagate external container value updates to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const initialContainer: Container = mockContainer();
    const nextContainer: Container = mockContainer();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProvider = new ContainerProvider(element, {
      container: initialContainer,
    });

    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    const receivedContexts: Array<Container> = [];

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContexts.push(context);
      },
    });

    element.appendChild(child);

    controller.value = nextContainer;

    expect(receivedContexts).toEqual([initialContainer, nextContainer]);
    expect(controller.value).toBe(nextContainer);

    element.remove();

    expect(controller.value).toBeUndefined();
  });

  it("should not dispose provided external container on disconnect", () => {
    const element: TestProviderElement = new TestProviderElement();
    const container: Container = mockContainer();
    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    new ContainerProvider(element, {
      container,
    });

    document.body.appendChild(element);
    element.remove();

    expect(unbindAllSpy).not.toHaveBeenCalled();
  });

  it("should store external container updates while disconnected without publishing values", () => {
    const element: TestProviderElement = new TestProviderElement();
    const initialContainer: Container = mockContainer();
    const nextContainer: Container = mockContainer();
    const controller: ContainerProvider = new ContainerProvider(element, { container: initialContainer });

    controller.setValue(nextContainer);

    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value).toBe(nextContainer);

    element.remove();
  });

  it("should provision and deprovision external containers without disposing them", () => {
    const element: TestProviderElement = new TestProviderElement();
    const { LifecycleService, events } = createLifecycleService();
    const container: Container = createContainer({
      activate: [LifecycleService],
      entries: [LifecycleService],
    });
    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    expect(events).toEqual(["activated"]);

    new ContainerProvider(element, {
      container,
    });

    document.body.appendChild(element);

    expect(events).toEqual(["activated", "provision"]);

    element.remove();

    expect(events).toEqual(["activated", "provision", "deprovision"]);
    expect(unbindAllSpy).not.toHaveBeenCalled();
    expect(container.isBound(LifecycleService)).toBe(true);
  });

  it("should deprovision previous external containers and provision replacement values", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const firstContainer: Container = createContainer({ entries: [FirstService] });
    const secondContainer: Container = createContainer({ entries: [SecondService] });

    const firstUnbindAllSpy = jest.spyOn(firstContainer, "unbindAll");
    const secondUnbindAllSpy = jest.spyOn(secondContainer, "unbindAll");

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { container: firstContainer });

    document.body.appendChild(element);

    expect(events).toEqual(["activated-first", "provision-first"]);

    controller.setValue(secondContainer);

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "activated-second",
      "provision-second",
    ]);

    element.remove();

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "activated-second",
      "provision-second",
      "deprovision-second",
    ]);
    expect(controller.value).toBeUndefined();
    expect(firstUnbindAllSpy).not.toHaveBeenCalled();
    expect(secondUnbindAllSpy).not.toHaveBeenCalled();
  });

  it("should reject config updates for external container providers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { container: mockContainer() });

    expect(() => controller.setConfig({ entries: [] })).toThrow(
      "ContainerProvider uses an external container. Use `setValue(container)` to replace it."
    );
  });

  it("should create managed container on connect and provide it to child consumers", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProvider = new ContainerProvider(element, {
      config: { entries: [{ id: CONFIG_TOKEN, value: "managed" }] },
    });

    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value).toBeInstanceOf(Container);
    expect(controller.value.get(CONFIG_TOKEN)).toBe("managed");

    let receivedContext: Maybe<Container>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(receivedContext).toBe(controller.value);

    element.remove();

    expect(controller.value).toBeUndefined();
  });

  it("should provision managed containers and deprovision before disposal", () => {
    const element: TestProviderElement = new TestProviderElement();
    const { LifecycleService, events } = createLifecycleService();
    const controller: ContainerProvider = new ContainerProvider(element, {
      config: {
        entries: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    document.body.appendChild(element);

    const firstContainer: Container = controller.value;

    expect(events).toEqual(["activated", "provision"]);

    element.remove();

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value).not.toBe(firstContainer);
    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation", "activated", "provision"]);

    element.remove();
  });

  it("should reject direct container replacement for managed providers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { config: { entries: [GenericService] } });

    expect(() => controller.setValue(mockContainer())).toThrow(
      "ContainerProvider owns managed containers. Use `setConfig(config)` to replace the managed container."
    );
  });

  it("should deprovision previous managed containers and provision updated config", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { config: { entries: [FirstService] } });

    document.body.appendChild(element);

    const firstContainer: Container = controller.value;

    expect(events).toEqual(["activated-first", "provision-first"]);

    controller.setConfig({ entries: [SecondService] });

    expect(controller.value).not.toBe(firstContainer);
    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
    ]);

    element.remove();

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
      "deprovision-second",
      "deactivation-second",
    ]);
  });

  it("should store replacement managed config before first connect", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { config: { entries: [FirstService] } });

    controller.setConfig({ entries: [SecondService] });

    expect(events).toEqual([]);
    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value.get(SecondService)).toBeInstanceOf(SecondService);
    expect(events).toEqual(["activated-second", "provision-second"]);

    element.remove();
  });

  it("should replace managed config while disconnected and provision it on reconnect", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, { config: { entries: [FirstService] } });

    document.body.appendChild(element);

    const firstContainer: Container = controller.value;

    expect(events).toEqual(["activated-first", "provision-first"]);

    element.remove();

    expect(events).toEqual(["activated-first", "provision-first", "deprovision-first", "deactivation-first"]);
    expect(controller.value).toBeUndefined();

    controller.setConfig({ entries: [SecondService] });

    expect(events).toEqual(["activated-first", "provision-first", "deprovision-first", "deactivation-first"]);
    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    expect(controller.value).not.toBe(firstContainer);
    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
    ]);

    element.remove();

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
      "deprovision-second",
      "deactivation-second",
    ]);
  });

  it("should validate managed activation entries before first connect", () => {
    @Injectable()
    class LifecycleService {}

    const element: TestProviderElement = new TestProviderElement();

    expect(
      () =>
        new ContainerProvider(element, {
          config: {
            activate: ["MissingService"],
            entries: [LifecycleService],
          },
        })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");
  });

  it("should activate true descriptor entries before first connect", () => {
    const events: Array<string> = [];
    const { LifecycleService: DirectService } = createLifecycleService({
      events,
      methods: ["activated"],
      suffix: "direct",
    });
    const { LifecycleService: DescriptorService } = createLifecycleService({
      events,
      methods: ["activated"],
      suffix: "descriptor",
    });

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, {
      config: {
        activate: true,
        entries: [
          DirectService,
          {
            bindingType: BindingType.Instance,
            id: "DESCRIPTOR",
            value: DescriptorService,
          },
        ],
      },
    });

    expect(controller.value).toBeUndefined();
    expect(events).toEqual([]);

    document.body.appendChild(element);

    expect(events).toEqual(["activated-direct", "activated-descriptor"]);
    expect(controller.value.get("DESCRIPTOR")).toBeInstanceOf(DescriptorService);

    element.remove();
  });

  it("should dispose managed container on disconnect and recreate it on reconnect", () => {
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

    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProvider = new ContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        entries: [LifecycleService],
      },
    });

    expect(lifecycleEvents).toEqual([]);
    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    const firstContainer: Container = controller.value;

    expect(lifecycleEvents).toEqual(["activate"]);

    element.remove();

    expect(lifecycleEvents).toEqual(["activate", "deactivate"]);
    expect(controller.value).toBeUndefined();

    document.body.appendChild(element);

    const secondContainer: Container = controller.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);

    element.remove();

    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate", "deactivate"]);
  });

  it("should activate all managed entries when activate is true", () => {
    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class FirstService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("first");
      }
    }

    @Injectable()
    class SecondService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("second");
      }
    }

    const element: TestProviderElement = new TestProviderElement();

    new ContainerProvider(element, {
      config: {
        activate: true,
        entries: [FirstService, SecondService],
      },
    });

    expect(lifecycleEvents).toEqual([]);

    document.body.appendChild(element);

    expect(lifecycleEvents).toEqual(["first", "second"]);

    element.remove();
  });
});
