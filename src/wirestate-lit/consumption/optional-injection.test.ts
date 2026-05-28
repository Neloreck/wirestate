import { ReactiveElement } from "@lit/reactive-element";
import { bindConstant, Container, ServiceIdentifier } from "@wirestate/core";
import { mockBind, mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";
import { Optional } from "../types/general";

import { optionalInjection } from "./optional-injection";

describe("optionalInjection", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign null when token is not bound", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

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

  it("should inject bound service", () => {
    const container: Container = mockContainer();

    mockBind(container, GenericService);
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

  it("should use onFallback when token is not bound", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

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
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

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

  it("should provide container to onFallback", () => {
    const container: Container = mockContainer();
    const unboundToken: ServiceIdentifier<string> = Symbol("unbound-token");
    const boundToken: ServiceIdentifier<string> = Symbol("bound-token");

    bindConstant<string>(container, {
      id: boundToken,
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
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      @optionalInjection({
        injectionId: token,
        onFallback: () => "options-fallback",
      })
      public value: Optional<string> = null;
    }

    const element: TestOptionsElement = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("options-fallback");
  });

  it("should use separate fallback parameter with options object", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-parameter-fallback-element")
    class TestOptionsParameterFallbackElement extends ReactiveElement {
      @optionalInjection({ injectionId: token }, () => 30)
      public value: string | number = 0;
    }

    const element: TestOptionsParameterFallbackElement = new TestOptionsParameterFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(30);
  });

  it("should prefer options fallback over separate fallback parameter", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-options-fallback-priority-element")
    class TestOptionsFallbackPriorityElement extends ReactiveElement {
      @optionalInjection(
        {
          injectionId: token,
          onFallback: () => "options-fallback",
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
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-typed-options-element")
    class TestTypedOptionsElement extends ReactiveElement {
      @optionalInjection({
        injectionId: token,
        onFallback: () => 20,
      })
      public value: string | number = 0;
    }

    const element: TestTypedOptionsElement = new TestTypedOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe(20);
  });
});

describe("optionalInjection (new standard decorator)", () => {
  function initializeStandardAccessor<C extends ReactiveElement, V>(
    element: C,
    property: PropertyKey,
    decorator: (target: ClassAccessorDecoratorTarget<C, V>, context: ClassAccessorDecoratorContext<C, V>) => void
  ): void {
    const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      property
    );

    expect(descriptor?.get).toBeDefined();
    expect(descriptor?.set).toBeDefined();

    const target: ClassAccessorDecoratorTarget<C, V> = {
      get: descriptor?.get as (this: C) => V,
      set: descriptor?.set as (this: C, value: V) => void,
    };
    const initializers: Array<(this: C) => void> = [];

    decorator(target, {
      addInitializer: (initializer: (this: C) => void): void => {
        initializers.push(initializer);
      },
    } as ClassAccessorDecoratorContext<C, V>);

    initializers.forEach((initializer) => initializer.call(element));
  }

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign null for standard accessors when token is not bound", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-standard-missing-element")
    class TestStandardMissingElement extends ReactiveElement {
      private injectedValue: Optional<string> = "initial-value";

      public get value(): Optional<string> {
        return this.injectedValue;
      }

      public set value(value: Optional<string>) {
        this.injectedValue = value;
      }
    }

    const element: TestStandardMissingElement = new TestStandardMissingElement();

    initializeStandardAccessor<TestStandardMissingElement, Optional<string>>(
      element,
      "value",
      optionalInjection(token)
    );

    fixture.provider.appendChild(element);

    expect(element.value).toBeNull();
  });

  it("should inject bound service for standard accessors", () => {
    const container: Container = mockContainer({
      bindings: [GenericService],
    });

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-standard-bound-element")
    class TestStandardBoundElement extends ReactiveElement {
      private injectedService: Optional<GenericService> = null;

      public get service(): Optional<GenericService> {
        return this.injectedService;
      }

      public set service(service: Optional<GenericService>) {
        this.injectedService = service;
      }
    }

    const element: TestStandardBoundElement = new TestStandardBoundElement();

    initializeStandardAccessor<TestStandardBoundElement, Optional<GenericService>>(
      element,
      "service",
      optionalInjection(GenericService)
    );

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service?.getValue()).toBe("test-value");
  });
});
