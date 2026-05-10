import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { mockContainer, mockService } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { injection } from "./injection";

describe("@injection decorator", () => {
  let fixture: LitProvisionFixture;

  beforeEach(() => {
    const container: Container = mockContainer();

    mockService(GenericService, container);

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should inject service using options object", () => {
    @customElement("test-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      @injection({ injectionId: GenericService })
      public service!: GenericService;
    }

    const element: TestOptionsElement = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.service).toBeInstanceOf(GenericService);
    expect(element.service.getValue()).toBe("test-value");
  });

  it("should inject service using direct injectionId", () => {
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
});
