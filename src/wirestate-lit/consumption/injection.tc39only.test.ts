import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { Optional } from "../types/general";

import { injection } from "./injection";

describe("injection on standard accessors", () => {
  let fixture: LitProvisionFixture;

  beforeEach(() => {
    const container: Container = new Container();

    container.bind(GenericService);

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should inject bound instances into accessors using a direct token", () => {
    @customElement("test-injection-accessor-direct-element")
    class TestAccessorDirectElement extends ReactiveElement {
      @injection(GenericService)
      public accessor service!: GenericService;
    }

    const element: TestAccessorDirectElement = new TestAccessorDirectElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service.getValue()).toBe("test-value");
  });

  it("should inject into wider accessor types using an options object", () => {
    @customElement("test-injection-accessor-options-element")
    class TestAccessorOptionsElement extends ReactiveElement {
      @injection({ token: GenericService })
      public accessor service: Optional<GenericService> = null;
    }

    const element: TestAccessorOptionsElement = new TestAccessorOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
  });

  it("should inject string constants from symbol tokens into accessors", () => {
    const API_URL: unique symbol = Symbol("api-url");

    fixture.container.bind({
      token: API_URL,
      value: "https://api.example.com",
    });

    @customElement("test-injection-accessor-string-constant-element")
    class TestAccessorStringConstantElement extends ReactiveElement {
      @injection<string>(API_URL)
      public accessor apiUrl: string = "";
    }

    const element: TestAccessorStringConstantElement = new TestAccessorStringConstantElement();

    fixture.provider.appendChild(element);

    expect(element.apiUrl).toBe("https://api.example.com");
  });

  it("should reject accessors with incompatible types at compile time", () => {
    @customElement("test-injection-accessor-mismatch-element")
    class TestAccessorMismatchElement extends ReactiveElement {
      // @ts-expect-error - the injected service is not assignable to a number accessor.
      @injection(GenericService)
      public accessor counter: number = 0;
    }

    expect(TestAccessorMismatchElement).toBeDefined();
  });
});
