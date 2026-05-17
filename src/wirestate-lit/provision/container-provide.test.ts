import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

import { containerProvide } from "./container-provide";
import { ContainerProviderController } from "./container-provider-controller";

describe("containerProvide", () => {
  @customElement("ws-container-provide-decorated")
  class DecoratedElement extends ReactiveElement {
    @containerProvide({
      container: mockContainer(),
    })
    public container!: ContainerProviderController;
  }

  @customElement("ws-container-provide-child")
  class ChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should expose an ContainerProviderController instance immediately after construction", () => {
    const element: DecoratedElement = new DecoratedElement();

    expect(element.container).toBeInstanceOf(ContainerProviderController);
    expect(element.container.value).toBeInstanceOf(Container);

    document.body.appendChild(element);
    expect(element.container).toBeInstanceOf(ContainerProviderController);
    expect(element.container.value).toBeInstanceOf(Container);

    element.remove();
    expect(element.container).toBeInstanceOf(ContainerProviderController);
    expect(element.container.value).toBeInstanceOf(Container);
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
    expect(receivedContainer!).toBe(element.container.value);

    element.remove();
  });
});
