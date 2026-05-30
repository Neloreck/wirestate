import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { ChildContainerProvider } from "./child-container-provider";
import { provideChildContainer } from "./provide-child-container";

describe("provideChildContainer", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";
  const PARENT_TOKEN: string = "PARENT_TOKEN";

  @customElement("ws-provide-child-container-decorated")
  class DecoratedElement extends ReactiveElement {
    @provideChildContainer({
      config: {
        bindings: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    })
    public containerProvider!: ChildContainerProvider;
  }

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture?.cleanup();
  });

  it("should expose a child container provider controller and derive its container from parent context", () => {
    const parent: Container = createContainer({
      bindings: [{ id: PARENT_TOKEN, value: "parent-value" }],
    });

    fixture = createLitProvision(parent);

    const element: DecoratedElement = new DecoratedElement();

    expect(element.containerProvider).toBeInstanceOf(ChildContainerProvider);
    expect(element.containerProvider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    expect(element.containerProvider.value).toBeInstanceOf(Container);
    expect(element.containerProvider.value).not.toBe(parent);
    expect(element.containerProvider.value.get(CONFIG_TOKEN)).toBe("child-value");
    expect(element.containerProvider.value.get(PARENT_TOKEN)).toBe("parent-value");
  });
});
