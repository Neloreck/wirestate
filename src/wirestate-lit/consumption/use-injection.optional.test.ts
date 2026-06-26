/**
 * @jest-environment jsdom
 */

import { ReactiveElement } from "@lit/reactive-element";
import { type ServiceToken, CommandBus, Container, EventBus, QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { type Optional } from "../types/general";

import { useInjection } from "./use-injection";

describe("useInjection (optional)", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should hold undefined when token is not bound", () => {
    const container: Container = new Container();
    const token: unique symbol = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-missing-element")
    class TestMissingElement extends ReactiveElement {
      public service = useInjection(this, { token, optional: true });
    }

    const element = new TestMissingElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeUndefined();
  });

  it("should resolve bound service", () => {
    const container: Container = new Container({
      bindings: [EventBus, CommandBus, QueryBus, GenericService],
    });

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-bound-element")
    class TestBoundElement extends ReactiveElement {
      public service = useInjection(this, { token: GenericService, optional: true });
    }

    const element = new TestBoundElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value?.getValue()).toBe("test-value");
  });

  it("should use a factory fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: unique symbol = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-fallback-element")
    class TestFallbackElement extends ReactiveElement {
      public data = useInjection(this, { token, fallback: () => "fallback-value" });
    }

    const element = new TestFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("fallback-value");
  });

  it("should type fallback values separately from injection values", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-typed-fallback-element")
    class TestTypedFallbackElement extends ReactiveElement {
      public data = useInjection(this, { token, fallback: () => 10 });
    }

    const element = new TestTypedFallbackElement();

    fixture.provider.appendChild(element);

    const value: string | number = element.data.value;

    expect(value).toBe(10);
    expect(element.data.value).toBe(10);
  });

  it("should provide the container to the fallback factory", () => {
    const container: Container = new Container();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind({ token: boundToken, value: "bound-value" });

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-container-fallback-element")
    class TestContainerFallbackElement extends ReactiveElement {
      public data = useInjection(this, { token: unboundToken, fallback: (container) => container.get(boundToken) });
    }

    const element = new TestContainerFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("bound-value");
  });

  it("should expose the initial value until the context resolves", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-initial-element")
    class TestInitialElement extends ReactiveElement {
      public data = useInjection(this, {
        token,
        value: "initial-value",
        optional: true,
      });
    }

    const element = new TestInitialElement();
    const initialValue: Optional<string> = element.data.value;

    fixture.provider.appendChild(element);

    expect(initialValue).toBe("initial-value");
    expect(element.data.value).toBeUndefined();
  });

  it("should use a raw value fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-raw-fallback-element")
    class TestRawFallbackElement extends ReactiveElement {
      public data = useInjection(this, { token, fallback: "guest" });
    }

    const element = new TestRawFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("guest");
  });

  it("should preserve a null raw fallback as a deliberate value", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-injection-optional-null-fallback-element")
    class TestNullFallbackElement extends ReactiveElement {
      public data = useInjection(this, { token, fallback: null });
    }

    const element = new TestNullFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBeNull();
  });
});
