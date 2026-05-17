import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  let fixture: LitProvisionFixture;
  let container: Container;

  beforeEach(() => {
    container = mockContainer();
    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should expose active container from parent context", () => {
    @customElement("test-use-container-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);

    expect(element.container.value).toBe(container);
  });
});
