import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { containerProvide } from "./container-provide";
import { ContainerProvider } from "./container-provider";

describe("containerProvide", () => {
  @customElement("ws-container-provide-decorated")
  class DecoratedElement extends ReactiveElement {
    @containerProvide({
      container: mockContainer(),
    })
    public containerProvider!: ContainerProvider;
  }

  @customElement("ws-container-provide-child")
  class ChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should expose an ContainerProvider instance immediately after construction", () => {
    const element: DecoratedElement = new DecoratedElement();

    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeInstanceOf(Container);

    document.body.appendChild(element);
    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeInstanceOf(Container);

    element.remove();
    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeInstanceOf(Container);
  });

  it("should provide container to child elements", () => {
    const element: DecoratedElement = new DecoratedElement();
    const child: ChildElement = new ChildElement();

    document.body.appendChild(element);

    let receivedContainer: Maybe<Container>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: false,
      callback: (context) => {
        receivedContainer = context;
      },
    });

    element.appendChild(child);

    expect(receivedContainer).toBeDefined();
    expect(receivedContainer).toBe(element.containerProvider.value);

    element.remove();
  });
});
