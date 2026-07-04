/**
 * @jest-environment jsdom
 *
 * Runs under BOTH the legacy and the tc39 decorator transforms (the `.tc39.test.ts`
 * suffix is the dual-run marker). `useContainer` is a plain function using the
 * imperative `ContextConsumer` controller, so its behaviour must be identical in
 * both decorator modes - these tests pin that.
 */

import { ReactiveElement } from "@lit/reactive-element";
import { Container, WirestateError } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";

import { useContainer } from "./use-container";

describe("useContainer provider boundary", () => {
  let fixture: LitProvisionFixture;
  let container: Container;
  const orphans: Array<HTMLElement> = [];

  beforeEach(() => {
    container = new Container();
    fixture = createLitProvision(container);
  });

  afterEach(() => {
    while (orphans.length) {
      orphans.pop()?.remove();
    }

    fixture.cleanup();
  });

  it("should resolve the active container when nested under a provider", () => {
    @customElement("test-use-container-boundary-resolved-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);

    expect(element.container.value).toBe(container);
  });

  it("should follow the active container when the provider value changes", () => {
    const nextContainer: Container = new Container();

    @customElement("test-use-container-boundary-updates-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);
    expect(element.container.value).toBe(container);

    fixture.contextProvider.setValue(nextContainer);
    expect(element.container.value).toBe(nextContainer);
  });

  it("should throw when read before connection (context never resolved)", () => {
    @customElement("test-use-container-boundary-disconnected-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    expect(() => element.container.value).toThrow(WirestateError);
    expect(() => element.container.value).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_CONTEXT }));
  });

  it("should throw when connected outside any container provider", () => {
    @customElement("test-use-container-boundary-orphan-element")
    class TestElement extends ReactiveElement {
      public readonly container = useContainer(this);
    }

    const element: TestElement = new TestElement();

    // Attached directly to the document body - a sibling of the provider, not a descendant.
    document.body.appendChild(element);
    orphans.push(element);

    expect(() => element.container.value).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_CONTEXT }));
  });
});
