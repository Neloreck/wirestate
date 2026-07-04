/**
 * @jest-environment jsdom
 *
 * Runs under BOTH the legacy and the tc39 decorator transforms (the `.tc39.test.ts`
 * suffix is the dual-run marker). `useInjection` is a plain function using the
 * imperative `ContextConsumer` controller, so its behaviour must be identical in
 * both decorator modes - these tests pin that.
 */

import { ReactiveElement } from "@lit/reactive-element";
import { type ServiceToken, CommandBus, Container, EventBus, QueryBus, WirestateError } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { ERROR_CODE_INVALID_CONTEXT } from "../error/error-code";

import { useInjection } from "./use-injection";

describe("useInjection provider boundary", () => {
  let fixture: LitProvisionFixture;
  const orphans: Array<HTMLElement> = [];

  beforeEach(() => {
    const container: Container = new Container({ bindings: [EventBus, CommandBus, QueryBus] });

    container.bind(GenericService);

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    while (orphans.length) {
      orphans.pop()?.remove();
    }

    fixture.cleanup();
  });

  it("should resolve a required value when nested under a provider", () => {
    @customElement("test-use-injection-boundary-resolved-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
  });

  it("should re-resolve the injected value when the provided container changes", () => {
    @customElement("test-use-injection-boundary-container-change-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element: TestElement = new TestElement();

    fixture.provider.appendChild(element);

    const first: GenericService = element.service.value;

    expect(first).toBeInstanceOf(GenericService);

    const nextContainer: Container = new Container({ bindings: [EventBus, CommandBus, QueryBus] });

    nextContainer.bind(GenericService);
    fixture.contextProvider.setValue(nextContainer);

    const second: GenericService = element.service.value;

    // Subscribed lookups follow the context: a new container yields a value resolved from it.
    expect(second).toBeInstanceOf(GenericService);
    expect(second).not.toBe(first);
  });

  it("should throw for a required value read before connection (context never resolved)", () => {
    @customElement("test-use-injection-boundary-disconnected-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element: TestElement = new TestElement();

    expect(() => element.service.value).toThrow(WirestateError);
    expect(() => element.service.value).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_CONTEXT }));
  });

  it("should throw for a required value when connected outside any provider", () => {
    @customElement("test-use-injection-boundary-orphan-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element: TestElement = new TestElement();

    document.body.appendChild(element);
    orphans.push(element);

    expect(() => element.service.value).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_CONTEXT }));
  });

  it("should hold undefined for an optional lookup before the context resolves (no throw)", () => {
    const token: ServiceToken<string> = Symbol("optional-boundary-token");

    @customElement("test-use-injection-boundary-optional-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, { token, optional: true });
    }

    const element: TestElement = new TestElement();

    // Read while disconnected: optional lookups are honest about being absent, so no throw.
    expect(element.service.value).toBeUndefined();
  });

  it("should hold undefined for a fallback lookup before the context resolves (no throw)", () => {
    const token: ServiceToken<string> = Symbol("fallback-boundary-token");

    @customElement("test-use-injection-boundary-fallback-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, { token, fallback: "guest" });
    }

    const element: TestElement = new TestElement();

    // Fallback only applies once resolved on a miss; before resolution the holder is empty, not throwing.
    expect(element.service.value).toBeUndefined();

    fixture.provider.appendChild(element);
    orphans.push(element);

    expect(element.service.value).toBe("guest");
  });

  it("should hold an explicit initial value for a required lookup instead of throwing", () => {
    const token: ServiceToken<string> = Symbol("initial-boundary-token");

    @customElement("test-use-injection-boundary-initial-element")
    class TestElement extends ReactiveElement {
      public service = useInjection(this, { token, value: "initial-value" });
    }

    const element: TestElement = new TestElement();

    // Required, but an initial value was supplied: the escape hatch suppresses the boundary throw.
    expect(element.service.value).toBe("initial-value");
  });
});
