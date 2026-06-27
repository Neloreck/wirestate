/**
 * @jest-environment jsdom
 */

import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type Maybe } from "../types/general";

import { ContainerContext } from "./container-context";
import { ContainerProvider } from "./container-provider";
import { provideContainer } from "./provide-container";

describe("provideContainer", () => {
  @customElement("ws-provide-container-decorated")
  class DecoratedElement extends ReactiveElement {
    @provideContainer({ config: {} })
    public containerProvider!: ContainerProvider;
  }

  @customElement("ws-provide-container-child")
  class ChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should expose a ContainerProvider instance immediately and publish values while connected", () => {
    const element: DecoratedElement = new DecoratedElement();

    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeUndefined();

    document.body.appendChild(element);
    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeInstanceOf(Container);

    element.remove();
    expect(element.containerProvider).toBeInstanceOf(ContainerProvider);
    expect(element.containerProvider.value).toBeUndefined();
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

  it("should create an independent provider for each decorated element instance", () => {
    const firstElement: DecoratedElement = new DecoratedElement();
    const firstProvider: ContainerProvider = firstElement.containerProvider;

    const secondElement: DecoratedElement = new DecoratedElement();
    const secondProvider: ContainerProvider = secondElement.containerProvider;

    expect(firstProvider).toBeInstanceOf(ContainerProvider);
    expect(secondProvider).toBeInstanceOf(ContainerProvider);
    expect(firstProvider).not.toBe(secondProvider);

    document.body.appendChild(firstElement);
    document.body.appendChild(secondElement);

    expect(firstProvider.value).toBeInstanceOf(Container);
    expect(secondProvider.value).toBeInstanceOf(Container);
    expect(firstProvider.value).not.toBe(secondProvider.value);

    firstElement.remove();

    expect(firstProvider.value).toBeUndefined();
    expect(secondProvider.value).toBeInstanceOf(Container);
  });
});
