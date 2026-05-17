import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer, SEED } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { IocContextObject, IocContext } from "../context/ioc-context";
import { AnyObject, Maybe } from "../types/general";

import { IocProviderController } from "./ioc-provider-controller";
import { useIocProvision } from "./use-ioc-provision";

describe("useIocProvision hook", () => {
  @customElement("ws-use-ioc-provision-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-use-ioc-provision-child")
  class TestChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should return an instance of IocProviderController", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = useIocProvision(element);

    expect(controller).toBeInstanceOf(IocProviderController);
  });

  it("should create a new container when none is provided", () => {
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = useIocProvision(element);

    document.body.appendChild(element);

    expect(controller.container).toBeDefined();
    expect(controller.container).toBeInstanceOf(Container);
    expect(controller.value.container).toBe(controller.container);

    element.remove();
  });

  it("should use the provided container", () => {
    const container: Container = createContainer();
    const element: TestProviderElement = new TestProviderElement();
    const controller: IocProviderController = useIocProvision(element, { container });

    document.body.appendChild(element);

    expect(controller.container).toBe(container);

    element.remove();
  });

  it("should provide IocContext to child consumers", () => {
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const controller: IocProviderController = useIocProvision(element);

    document.body.appendChild(element);

    let receivedContext: Maybe<IocContext>;

    new ContextConsumer(child, {
      context: IocContextObject,
      subscribe: true,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(receivedContext).toBeDefined();
    expect(receivedContext?.container).toBe(controller.container);
    expect(receivedContext?.revision).toBe(1);

    controller.nextRevision();
    expect(receivedContext?.revision).toBe(2);

    element.remove();
  });

  it("should apply seed to the container when host connects", () => {
    const element: TestProviderElement = new TestProviderElement();
    const seed: AnyObject = { test: "data" };
    const controller: IocProviderController = useIocProvision(element, { seed });

    document.body.appendChild(element);

    expect(controller.container.get(SEED)).toEqual(seed);

    element.remove();
  });
});
