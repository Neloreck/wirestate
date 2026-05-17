import { ReactiveElement } from "@lit/reactive-element";
import { Container, WireScope } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { useScope } from "./use-scope";

describe("useScope", () => {
  let fixture: LitProvisionFixture;
  let container: Container;

  beforeEach(() => {
    container = mockContainer();
    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should expose active WireScope from parent context", () => {
    @customElement("test-use-scope-element")
    class TestElement extends ReactiveElement {
      public readonly scope = useScope(this);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);

    expect(element.scope.value).toBeInstanceOf(WireScope);
    expect(element.scope.value.getContainer()).toBe(container);
  });
});
