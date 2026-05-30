import { ReactiveElement } from "@lit/reactive-element";
import { bind, Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { injection } from "./injection";

describe("injection", () => {
  let fixture: LitProvisionFixture;

  beforeEach(() => {
    const container: Container = mockContainer();

    bind(container, GenericService);

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should inject service using options object", () => {
    @customElement("test-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      @injection({ token: GenericService })
      public service!: GenericService;
    }

    const element: TestOptionsElement = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service.getValue()).toBe("test-value");
  });

  it("should inject service using direct token", () => {
    @customElement("test-injection-direct-element")
    class TestDirectElement extends ReactiveElement {
      @injection(GenericService)
      public service!: GenericService;
    }

    const element: TestDirectElement = new TestDirectElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service.getValue()).toBe("test-value");
  });

  it("should inject string constants from symbol tokens", () => {
    const API_URL: unique symbol = Symbol("api-url");

    bind(fixture.container, {
      token: API_URL,
      value: "https://api.example.com",
    });

    @customElement("test-injection-string-constant-element")
    class TestStringConstantElement extends ReactiveElement {
      @injection<string>(API_URL)
      public apiUrl!: string;
    }

    const element: TestStringConstantElement = new TestStringConstantElement();

    fixture.provider.appendChild(element);

    expect(element.apiUrl).toBe("https://api.example.com");
  });

  it("should inject symbol constants from string tokens", () => {
    const STATUS_TOKEN: string = "status-token";
    const READY_STATUS: unique symbol = Symbol("ready-status");

    bind(fixture.container, {
      token: STATUS_TOKEN,
      value: READY_STATUS,
    });

    @customElement("test-injection-symbol-constant-element")
    class TestSymbolConstantElement extends ReactiveElement {
      @injection<symbol>(STATUS_TOKEN)
      public status!: symbol;
    }

    const element: TestSymbolConstantElement = new TestSymbolConstantElement();

    fixture.provider.appendChild(element);

    expect(element.status).toBe(READY_STATUS);
  });
});
