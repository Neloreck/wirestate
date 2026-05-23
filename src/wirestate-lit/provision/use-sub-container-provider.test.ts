import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { SubContainerProvider } from "./sub-container-provider";
import { useSubContainerProvider } from "./use-sub-container-provider";

describe("useSubContainerProvider", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";
  const PARENT_TOKEN: string = "PARENT_TOKEN";

  @customElement("ws-use-sub-container-provider-host")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture?.cleanup();
  });

  it("should create and provide a child container derived from the current parent context", () => {
    const parent: Container = createContainer({
      entries: [
        { id: PARENT_TOKEN, value: "parent-value" },
        { id: CONFIG_TOKEN, value: "parent-value" },
      ],
    });

    fixture = createLitProvision(parent);

    const element: TestConsumerElement = new TestConsumerElement();
    const provider: SubContainerProvider = useSubContainerProvider(element, {
      config: {
        entries: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    expect(provider).toBeInstanceOf(SubContainerProvider);
    expect(provider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    expect(provider.value).toBeInstanceOf(Container);
    expect(provider.value).not.toBe(parent);
    expect(provider.value.get(CONFIG_TOKEN)).toBe("child-value");
    expect(provider.value.get(PARENT_TOKEN)).toBe("parent-value");
  });
});
