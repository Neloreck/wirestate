import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { ContainerProviderController } from "./container-provider-controller";
import { useContainerProvision } from "./use-container-provision";

describe("useContainerProvision hook", () => {
  @customElement("ws-use-ioc-provision-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-use-ioc-provision-child")
  class TestChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should return an instance of IocProviderController", () => {
    const container: Container = mockContainer();
    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProviderController = useContainerProvision(element, { container });

    expect(controller).toBeInstanceOf(ContainerProviderController);
  });

  it("should create a managed container from creation options", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProviderController = useContainerProvision(element, { options: {} });

    document.body.appendChild(element);

    expect(controller.value).toBeDefined();
    expect(controller.value).toBeInstanceOf(Container);

    element.remove();
  });

  it("should use the provided container", () => {
    const container: Container = createContainer();
    const element: TestProviderElement = new TestProviderElement();
    const controller: ContainerProviderController = useContainerProvision(element, { container });

    document.body.appendChild(element);

    expect(controller.value).toBe(container);

    element.remove();
  });

  it("should provide IocContext to child consumers", () => {
    const container: Container = createContainer();
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const controller: ContainerProviderController = useContainerProvision(element, { container });

    document.body.appendChild(element);

    let receivedContainer: Maybe<Container>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContainer = context;
      },
    });

    element.appendChild(child);

    expect(receivedContainer).toBeDefined();
    expect(receivedContainer).toBe(controller.value);

    element.remove();
  });
});
