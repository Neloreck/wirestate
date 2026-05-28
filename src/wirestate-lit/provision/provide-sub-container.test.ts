import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { provideSubContainer } from "./provide-sub-container";
import { SubContainerProvider } from "./sub-container-provider";

describe("provideSubContainer", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";
  const PARENT_TOKEN: string = "PARENT_TOKEN";

  @customElement("ws-provide-sub-container-decorated")
  class DecoratedElement extends ReactiveElement {
    @provideSubContainer({
      config: {
        bindings: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    })
    public containerProvider!: SubContainerProvider;
  }

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture?.cleanup();
  });

  it("should expose a sub-container provider controller and derive its container from parent context", () => {
    const parent: Container = createContainer({
      bindings: [{ id: PARENT_TOKEN, value: "parent-value" }],
    });

    fixture = createLitProvision(parent);

    const element: DecoratedElement = new DecoratedElement();

    expect(element.containerProvider).toBeInstanceOf(SubContainerProvider);
    expect(element.containerProvider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    expect(element.containerProvider.value).toBeInstanceOf(Container);
    expect(element.containerProvider.value).not.toBe(parent);
    expect(element.containerProvider.value.get(CONFIG_TOKEN)).toBe("child-value");
    expect(element.containerProvider.value.get(PARENT_TOKEN)).toBe("parent-value");
  });
});
