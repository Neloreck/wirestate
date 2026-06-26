/**
 * @jest-environment jsdom
 */

import { ReactiveElement } from "@lit/reactive-element";
import { type ServiceToken, CommandBus, Container, EventBus, QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { type Optional } from "../types/general";

import { injection } from "./injection";

describe("injection (optional) on standard accessors", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should assign undefined for accessors when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-accessor-missing-element")
    class TestAccessorMissingElement extends ReactiveElement {
      @injection({ token, optional: true })
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

    @customElement("test-injection-optional-accessor-bound-element")
    class TestAccessorBoundElement extends ReactiveElement {
      @injection({ token: GenericService, optional: true })
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

    @customElement("test-injection-optional-non-nullable-element")
    class TestNonNullableElement extends ReactiveElement {
      // @ts-expect-error - the optional `undefined` value is not assignable to a non-nullable accessor.
      @injection({ token, optional: true })
      public accessor value: string = "";

      // @ts-expect-error - the optional `undefined` value is not assignable to a non-nullable field.
      @injection({ token, optional: true })
      public field: string = "";
    }

    expect(TestNonNullableElement).toBeDefined();
  });

  it("should use a fallback for accessors when token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-injection-optional-accessor-fallback-element")
    class TestAccessorFallbackElement extends ReactiveElement {
      @injection({ token, fallback: () => "fallback-value" })
      public accessor value: Optional<string> = undefined;
    }

    const element: TestAccessorFallbackElement = new TestAccessorFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.value).toBe("fallback-value");
  });
});
