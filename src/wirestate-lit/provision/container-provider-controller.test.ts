import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, Injectable, OnActivated, OnDeactivation } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { ContainerProviderController } from "./container-provider-controller";

describe("ContainerProviderController", () => {
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
    const controller: ContainerProviderController = new ContainerProviderController(element, {
      container: container,
    });

    document.body.appendChild(element);

    expect(controller.value).toBe(container);

    element.remove();
  });

  it("should provide container to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const container: Container = mockContainer();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProviderController = new ContainerProviderController(element, {
      container,
    });

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
  });

  it("should propagate external container value updates to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const initialContainer: Container = mockContainer();
    const nextContainer: Container = mockContainer();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProviderController = new ContainerProviderController(element, {
      container: initialContainer,
    });

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
  });

  it("should not dispose provided external container on disconnect", () => {
    const element: TestProviderElement = new TestProviderElement();
    const container: Container = mockContainer();
    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    new ContainerProviderController(element, {
      container,
    });

    document.body.appendChild(element);
    element.remove();

    expect(unbindAllSpy).not.toHaveBeenCalled();
  });

  it("should create managed container on connect and provide it to child consumers", () => {
    const CONFIG_TOKEN: string = "CONFIG_TOKEN";
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProviderController = new ContainerProviderController(element, {
      options: {
        entries: [{ id: CONFIG_TOKEN, value: "managed" }],
      },
    });

    expect(controller.value).toBeInstanceOf(Container);
    expect(controller.value.get(CONFIG_TOKEN)).toBe("managed");

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

    expect(receivedContext).toBe(controller.value);

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
    const controller: ContainerProviderController = new ContainerProviderController(element, {
      options: {
        activate: [LifecycleService],
        entries: [LifecycleService],
      },
    });

    expect(lifecycleEvents).toEqual([]);
    expect(controller.value).toBeInstanceOf(Container);

    document.body.appendChild(element);

    const firstContainer: Container = controller.value;

    expect(lifecycleEvents).toEqual(["activate"]);

    element.remove();

    expect(lifecycleEvents).toEqual(["activate", "deactivate"]);

    document.body.appendChild(element);

    const secondContainer: Container = controller.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);

    element.remove();

    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate", "deactivate"]);
  });
});
