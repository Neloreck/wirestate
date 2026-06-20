/**
 * @jest-environment jsdom
 */

import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  let fixture: LitProvisionFixture;
  let container: Container;

  beforeEach(() => {
    container = new Container();
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

  it("should update the active container when parent context changes", () => {
    const nextContainer: Container = new Container();

    @customElement("test-use-container-updates-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);
    expect(element.container.value).toBe(container);

    fixture.contextProvider.setValue(nextContainer);
    expect(element.container.value).toBe(nextContainer);
  });
});
