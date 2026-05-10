import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, SEED } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { ContainerContext, IocContext } from "../context/ioc-context";
import { Maybe } from "../types/general";

import { iocProvide } from "./ioc-provide";
import { IocProviderController } from "./ioc-provider-controller";

describe("iocProvide", () => {
  @customElement("ws-ioc-provide-decorated-seeded")
  class DecoratedElementWithSeed extends ReactiveElement {
    @iocProvide({ seed: { theme: "dark", locale: "en" } })
    public ioc!: IocProviderController;
  }

  @customElement("ws-ioc-provide-decorated")
  class DecoratedElement extends ReactiveElement {
    @iocProvide()
    public ioc!: IocProviderController;
  }

  @customElement("ws-ioc-provide-child")
  class ChildElement extends ReactiveElement {}

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((it) => it.remove());
  });

  it("should expose an IocProviderController instance immediately after construction", () => {
    const element: DecoratedElement = new DecoratedElement();

    expect(element.ioc).toBeInstanceOf(IocProviderController);
    expect(element.ioc.container).toBeInstanceOf(Container);

    document.body.appendChild(element);
    expect(element.ioc).toBeInstanceOf(IocProviderController);
    expect(element.ioc.container).toBeInstanceOf(Container);

    element.remove();
    expect(element.ioc).toBeInstanceOf(IocProviderController);
    expect(element.ioc.container).toBeInstanceOf(Container);
  });

  it("should provide IocContext to child elements", () => {
    const element: DecoratedElement = new DecoratedElement();
    const child: ChildElement = new ChildElement();

    document.body.appendChild(element);

    let receivedContext: Maybe<IocContext>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: false,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(receivedContext).toBeDefined();
    expect(receivedContext!.container).toBe(element.ioc.container);

    element.remove();
  });

  it("should apply seed to the container when host connects", () => {
    const element: DecoratedElementWithSeed = new DecoratedElementWithSeed();

    document.body.appendChild(element);

    expect(element.ioc.container.get(SEED)).toEqual({
      theme: "dark",
      locale: "en",
    });

    element.remove();
  });
});
