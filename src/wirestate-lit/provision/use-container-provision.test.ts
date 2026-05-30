import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { ContainerProvider } from "./container-provider";
import { useContainerProvider } from "./use-container-provision";

describe("useContainerProvider hook", () => {
  @customElement("ws-use-ioc-provision-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-use-ioc-provision-child")
  class TestChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should return an instance of ContainerProvider", () => {
    const container: Container = mockContainer();
    const element: TestProviderElement = new TestProviderElement();
    const provider: ContainerProvider = useContainerProvider(element, { container });

    expect(provider).toBeInstanceOf(ContainerProvider);
  });

  it("should create a managed container from creation options when connected", () => {
    const element: TestProviderElement = new TestProviderElement();
    const provider: ContainerProvider = useContainerProvider(element, { config: {} });

    expect(provider.value).toBeUndefined();

    document.body.appendChild(element);

    expect(provider.value).toBeDefined();
    expect(provider.value).toBeInstanceOf(Container);

    element.remove();

    expect(provider.value).toBeUndefined();
  });

  it("should use the provided container", () => {
    const container: Container = createContainer();
    const element: TestProviderElement = new TestProviderElement();
    const provider: ContainerProvider = useContainerProvider(element, { container });

    expect(provider.value).toBeUndefined();

    document.body.appendChild(element);

    expect(provider.value).toBe(container);

    element.remove();

    expect(provider.value).toBeUndefined();
  });

  it("should provide IocContext to child consumers", () => {
    const container: Container = createContainer();
    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const provider: ContainerProvider = useContainerProvider(element, { container });

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
    expect(receivedContainer).toBe(provider.value);

    element.remove();
  });
});
