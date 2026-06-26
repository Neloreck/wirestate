/**
 * @jest-environment jsdom
 */

import { ReactiveElement } from "@lit/reactive-element";
import { type ServiceToken, CommandBus, Container, EventBus, QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { type Nullable, type Optional } from "../types/general";

import { injection } from "./injection";

describe("injection (optional)", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign undefined when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-missing-element")
    class TestMissingElement extends ReactiveElement {
      @injection({ token, optional: true })
      public value: Optional<string> = "initial-value";
    }

    const element: TestMissingElement = new TestMissingElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBeUndefined();
  });

  it("should inject bound instance", () => {
    const container: Container = new Container({ bindings: [EventBus, CommandBus, QueryBus] });

    container.bind(GenericService);
    fixture = createLitProvision(container);

    @customElement("test-injection-optional-bound-element")
    class TestBoundElement extends ReactiveElement {
      @injection({ token: GenericService, optional: true })
      public service: Optional<GenericService> = undefined;
    }

    const element: TestBoundElement = new TestBoundElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service?.getValue()).toBe("test-value");
  });

  it("should use a factory fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-fallback-element")
    class TestFallbackElement extends ReactiveElement {
      @injection({ token, fallback: () => "fallback-value" })
      public value: Optional<string> = undefined;
    }

    const element: TestFallbackElement = new TestFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("fallback-value");
  });

  it("should type fallback values separately from injection values", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-typed-fallback-element")
    class TestTypedFallbackElement extends ReactiveElement {
      @injection({ token, fallback: () => 10 })
      public value: string | number = 0;
    }

    const element: TestTypedFallbackElement = new TestTypedFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(10);
  });

  it("should provide the container to the fallback factory", () => {
    const container: Container = new Container();
    const unboundToken: ServiceToken<string> = Symbol("unbound-token");
    const boundToken: ServiceToken<string> = Symbol("bound-token");

    container.bind({
      token: boundToken,
      value: "bound-value",
    });

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-container-fallback-element")
    class TestContainerFallbackElement extends ReactiveElement {
      @injection({ token: unboundToken, fallback: (container) => container.get(boundToken) })
      public value: Optional<string> = undefined;
    }

    const element: TestContainerFallbackElement = new TestContainerFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("bound-value");
  });

  it("should use a raw value fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-raw-fallback-element")
    class TestRawFallbackElement extends ReactiveElement {
      @injection({ token, fallback: "guest" })
      public value: Optional<string> = undefined;
    }

    const element: TestRawFallbackElement = new TestRawFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("guest");
  });

  it("should preserve a null raw fallback as a deliberate value", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-null-fallback-element")
    class TestNullFallbackElement extends ReactiveElement {
      @injection({ token, fallback: null })
      public value: Nullable<string> = null;
    }

    const element: TestNullFallbackElement = new TestNullFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBeNull();
  });
});
