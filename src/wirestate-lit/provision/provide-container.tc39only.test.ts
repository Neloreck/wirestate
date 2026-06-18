import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { ContainerContext } from "../context/container-context";
import { type Maybe } from "../types/general";

import { ContainerProvider } from "./container-provider";
import { provideContainer } from "./provide-container";

describe("provideContainer on standard accessors", () => {
  @customElement("ws-provide-container-accessor-decorated")
  class DecoratedAccessorElement extends ReactiveElement {
    @provideContainer({ config: {} })
    public accessor containerProvider!: ContainerProvider;
  }

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should expose a ContainerProvider through the accessor and publish values while connected", () => {
    const element: DecoratedAccessorElement = new DecoratedAccessorElement();

    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeUndefined();

    document.body.appendChild(element);
    expect(element.containerProvider.value).toBeInstanceOf(Container);

    element.remove();
    expect(element.containerProvider.value).toBeUndefined();
  });

  it("should provide the accessor-held container to child elements", () => {
    @customElement("ws-provide-container-accessor-child")
    class ChildElement extends ReactiveElement {}

    const element: DecoratedAccessorElement = new DecoratedAccessorElement();
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

  it("should reject accessors with incompatible types at compile time", () => {
    @customElement("ws-provide-container-accessor-mismatch")
    class MismatchedAccessorElement extends ReactiveElement {
      // @ts-expect-error - a ContainerProvider is not assignable to a number accessor.
      @provideContainer({ config: {} })
      public accessor counter: number = 0;
    }

    expect(MismatchedAccessorElement).toBeDefined();
  });
});
