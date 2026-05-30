import { ReactiveElement } from "@lit/reactive-element";
import { bind, Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { useInjection } from "./use-injection";

describe("useInjection", () => {
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
    @customElement("test-use-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      public service = useInjection(this, { token: GenericService });
    }

    const element = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value.getValue()).toBe("test-value");
  });

  it("should inject service using direct token", () => {
    @customElement("test-use-injection-direct-element")
    class TestDirectElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element = new TestDirectElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value.getValue()).toBe("test-value");
  });

  it("should inject string constants from symbol tokens", () => {
    const API_URL: unique symbol = Symbol("api-url");

    bind(fixture.container, {
      token: API_URL,
      value: "https://api.example.com",
    });

    @customElement("test-use-injection-string-constant-element")
    class TestStringConstantElement extends ReactiveElement {
      public apiUrl = useInjection<string>(this, API_URL);
    }

    const element = new TestStringConstantElement();

    fixture.provider.appendChild(element);

    expect(element.apiUrl.value).toBe("https://api.example.com");
  });

  it("should inject symbol constants from string tokens", () => {
    const STATUS_TOKEN: string = "status-token";
    const READY_STATUS: unique symbol = Symbol("ready-status");

    bind(fixture.container, {
      token: STATUS_TOKEN,
      value: READY_STATUS,
    });

    @customElement("test-use-injection-symbol-constant-element")
    class TestSymbolConstantElement extends ReactiveElement {
      public status = useInjection<symbol>(this, STATUS_TOKEN);
    }

    const element = new TestSymbolConstantElement();

    fixture.provider.appendChild(element);

    expect(element.status.value).toBe(READY_STATUS);
  });
});
