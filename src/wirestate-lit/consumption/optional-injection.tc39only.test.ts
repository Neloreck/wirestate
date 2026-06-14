import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, Container, EventBus, QueryBus, ServiceToken } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { Optional } from "../types/general";

import { optionalInjection } from "./optional-injection";

describe("optionalInjection on standard accessors", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign undefined for accessors when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-accessor-missing-element")
    class TestAccessorMissingElement extends ReactiveElement {
      @optionalInjection(token)
      public accessor value: Optional<string> = "initial-value";
    }

    const element: TestAccessorMissingElement = new TestAccessorMissingElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBeUndefined();
  });

  it("should inject bound instances into accessors", () => {
    const container: Container = new Container({
      bindings: [EventBus, CommandBus, QueryBus, GenericService],
    });

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-accessor-bound-element")
    class TestAccessorBoundElement extends ReactiveElement {
      @optionalInjection(GenericService)
      public accessor service: Optional<GenericService> = undefined;
    }

    const element: TestAccessorBoundElement = new TestAccessorBoundElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service?.getValue()).toBe("test-value");
  });

  it("should reject non-nullable members without a fallback at compile time", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-non-nullable-element")
    class TestNonNullableElement extends ReactiveElement {
      // @ts-expect-error - the default `undefined` value is not assignable to a non-nullable accessor.
      @optionalInjection(token)
      public accessor value: string = "";

      // @ts-expect-error - the default `undefined` value is not assignable to a non-nullable field.
      @optionalInjection(token)
      public field: string = "";
    }

    expect(TestNonNullableElement).toBeDefined();
  });

  it("should use fallback for accessors when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-optional-injection-accessor-fallback-element")
    class TestAccessorFallbackElement extends ReactiveElement {
      @optionalInjection(token, () => "fallback-value")
      public accessor value: Optional<string> = undefined;
    }

    const element: TestAccessorFallbackElement = new TestAccessorFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("fallback-value");
  });
});
