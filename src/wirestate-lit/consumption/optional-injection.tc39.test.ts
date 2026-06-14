import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, Container, EventBus, QueryBus, ServiceToken } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { Optional } from "../types/general";

import { optionalInjection } from "./optional-injection";

describe("optionalInjection", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign null when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-missing-element")
    class TestMissingElement extends ReactiveElement {
      @optionalInjection(token)
      public value: Optional<string> = "initial-value";
    }

    const element: TestMissingElement = new TestMissingElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBeNull();
  });

  it("should inject bound instance", () => {
    const container: Container = new Container({ bindings: [EventBus, CommandBus, QueryBus] });

    container.bind(GenericService);
    fixture = createLitProvision(container);

    @customElement("test-optional-injection-bound-element")
    class TestBoundElement extends ReactiveElement {
      @optionalInjection(GenericService)
      public service: Optional<GenericService> = null;
    }

    const element: TestBoundElement = new TestBoundElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service?.getValue()).toBe("test-value");
  });

  it("should use fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-fallback-element")
    class TestFallbackElement extends ReactiveElement {
      @optionalInjection(token, () => "fallback-value")
      public value: Optional<string> = null;
    }

    const element: TestFallbackElement = new TestFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("fallback-value");
  });

  it("should type fallback values separately from injection values", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-typed-fallback-element")
    class TestTypedFallbackElement extends ReactiveElement {
      @optionalInjection(token, () => 10)
      public value: string | number = 0;
    }

    const element: TestTypedFallbackElement = new TestTypedFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(10);
  });

  it("should provide container to fallback", () => {
    const container: Container = new Container();
    const unboundToken: ServiceToken<string> = Symbol("unbound-token");
    const boundToken: ServiceToken<string> = Symbol("bound-token");

    container.bind({
      token: boundToken,
      value: "bound-value",
    });

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-container-fallback-element")
    class TestContainerFallbackElement extends ReactiveElement {
      @optionalInjection(unboundToken, (container) => container.get(boundToken))
      public value: Optional<string> = null;
    }

    const element: TestContainerFallbackElement = new TestContainerFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("bound-value");
  });

  it("should use fallback from options object", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      @optionalInjection({
        token,
        fallback: () => "options-fallback",
      })
      public value: Optional<string> = null;
    }

    const element: TestOptionsElement = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("options-fallback");
  });

  it("should use separate fallback parameter with options object", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-parameter-fallback-element")
    class TestOptionsParameterFallbackElement extends ReactiveElement {
      @optionalInjection({ token }, () => 30)
      public value: string | number = 0;
    }

    const element: TestOptionsParameterFallbackElement = new TestOptionsParameterFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(30);
  });

  it("should prefer options fallback over separate fallback parameter", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-fallback-priority-element")
    class TestOptionsFallbackPriorityElement extends ReactiveElement {
      @optionalInjection(
        {
          token,
          fallback: () => "options-fallback",
        },
        () => "parameter-fallback"
      )
      public value: Optional<string> = null;
    }

    const element: TestOptionsFallbackPriorityElement = new TestOptionsFallbackPriorityElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("options-fallback");
  });

  it("should type fallback values from options object separately from injection values", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-typed-options-element")
    class TestTypedOptionsElement extends ReactiveElement {
      @optionalInjection({
        token,
        fallback: () => 20,
      })
      public value: string | number = 0;
    }

    const element: TestTypedOptionsElement = new TestTypedOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(20);
  });
});
