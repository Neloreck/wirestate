import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";
import { mockContainer, mockService } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { useInjection } from "./use-injection";

describe("useInjection", () => {
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
    @customElement("test-use-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      public service = useInjection(this, { injectionId: GenericService });
    }

    const element = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value.getValue()).toBe("test-value");
  });

  it("should inject service using direct injectionId", () => {
    @customElement("test-use-injection-direct-element")
    class TestDirectElement extends ReactiveElement {
      public service = useInjection(this, GenericService);
    }

    const element = new TestDirectElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value.getValue()).toBe("test-value");
  });
});
