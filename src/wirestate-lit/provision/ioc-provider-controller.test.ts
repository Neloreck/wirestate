import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createIocContainer, SEED } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { ContainerContext, IocContext } from "../context/ioc-context";
import { Maybe } from "../types/general";

import { IocProviderController } from "./ioc-provider-controller";

describe("IocProviderController", () => {
  @customElement("ws-ioc-provider-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-ioc-provider-child")
  class TestChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should create a new container when none is provided", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = new IocProviderController(element);

    document.body.appendChild(element);

    expect(controller.container).toBeDefined();
    expect(controller.container).toBeInstanceOf(Container);
    expect(controller.value.container).toBe(controller.container);
    expect(controller.value.revision).toBe(1);

    element.remove();
  });

  it("should use the provided container", () => {
    const container: Container = createIocContainer();
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = new IocProviderController(element, { container });

    document.body.appendChild(element);

    expect(controller.container).toBe(container);

    element.remove();
  });

  it("should increment revision on nextRevision and return the new value", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = new IocProviderController(element);

    document.body.appendChild(element);

    expect(controller.value.revision).toBe(1);

    expect(controller.nextRevision()).toBe(2);
    expect(controller.value.revision).toBe(2);

    expect(controller.nextRevision()).toBe(3);
    expect(controller.value.revision).toBe(3);

    element.remove();
  });

  it("should provide IocContext to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const controller: IocProviderController = new IocProviderController(element);

    document.body.appendChild(element);

    let receivedContext: Maybe<IocContext>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(receivedContext).toBeDefined();
    expect(receivedContext!.container).toBe(controller.container);
    expect(receivedContext!.revision).toBe(1);

    controller.nextRevision();

    expect(receivedContext!.container).toBe(controller.container);
    expect(receivedContext!.revision).toBe(2);

    controller.nextRevision();

    expect(receivedContext!.container).toBe(controller.container);
    expect(receivedContext!.revision).toBe(3);

    element.remove();
  });

  it("should apply seed to the container when host connects", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = new IocProviderController(element, {
      seed: { theme: "dark", locale: "en" },
    });

    document.body.appendChild(element);

    expect(controller.container.get(SEED)).toEqual({
      theme: "dark",
      locale: "en",
    });

    element.remove();
  });
});
