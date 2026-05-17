import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { subContainerProvide } from "./sub-container-provide";
import { SubContainerProviderController } from "./sub-container-provider-controller";

describe("subContainerProvide", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";
  const PARENT_TOKEN: string = "PARENT_TOKEN";

  @customElement("ws-sub-container-provide-decorated")
  class DecoratedElement extends ReactiveElement {
    @subContainerProvide({
      options: {
        entries: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    })
    public container!: SubContainerProviderController;
  }

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture?.cleanup();
  });

  it("should expose a child-container provider controller and derive its container from parent context", () => {
    const parent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "parent-value" }],
    });

    fixture = createLitProvision(parent);

    const element: DecoratedElement = new DecoratedElement();

    expect(element.container).toBeInstanceOf(SubContainerProviderController);
    expect(element.container.value).toBeUndefined();

    fixture.provider.appendChild(element);

    expect(element.container.value).toBeInstanceOf(Container);
    expect(element.container.value).not.toBe(parent);
    expect(element.container.value.get(CONFIG_TOKEN)).toBe("child-value");
    expect(element.container.value.get(PARENT_TOKEN)).toBe("parent-value");
  });
});
