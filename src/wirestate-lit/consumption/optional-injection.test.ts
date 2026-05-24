import { ReactiveElement } from "@lit/reactive-element";
import { bindConstant, Container, ServiceIdentifier } from "@wirestate/core";
import { mockContainer, mockService } from "@wirestate/core/test-utils";
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

    mockService(GenericService, container);
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
});
