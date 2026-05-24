import { ReactiveElement } from "@lit/reactive-element";
import { Container, ServiceIdentifier } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";
import { Optional } from "../types/general";

import { useOptionalInjection } from "./use-optional-injection";

describe("useOptionalInjection", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should return null when token is not bound", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-missing-element")
    class TestMissingElement extends ReactiveElement {
      public service = useOptionalInjection(this, token);
    }

    const element = new TestMissingElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeNull();
  });

  it("should resolve bound service", () => {
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-bound-element")
    class TestBoundElement extends ReactiveElement {
      public service = useOptionalInjection(this, GenericService);
    }

    const element = new TestBoundElement();

    fixture.provider.appendChild(element);

    expect(element.service.value).toBeInstanceOf(GenericService);
    expect(element.service.value?.getValue()).toBe("test-value");
  });

  it("should use onFallback when token is not bound", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-fallback-element")
    class TestFallbackElement extends ReactiveElement {
      public data = useOptionalInjection(this, token, () => "fallback-value");
    }

    const element = new TestFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("fallback-value");
  });

  it("should provide container to onFallback", () => {
    const container: Container = mockContainer();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind(boundToken).toConstantValue("bound-value");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-container-fallback-element")
    class TestContainerFallbackElement extends ReactiveElement {
      public data = useOptionalInjection(this, unboundToken, (container) => container.get(boundToken));
    }

    const element = new TestContainerFallbackElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("bound-value");
  });

  it("should use fallback from options object", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      public data = useOptionalInjection(this, {
        injectionId: token,
        onFallback: () => "options-fallback",
      });
    }

    const element = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("options-fallback");
  });

  it("should expose initial value until context resolves", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-initial-element")
    class TestInitialElement extends ReactiveElement {
      public data = useOptionalInjection(this, {
        injectionId: token,
        value: "initial-value",
      });
    }

    const element = new TestInitialElement();
    const initialValue: Optional<string> = element.data.value;

    fixture.provider.appendChild(element);

    expect(initialValue).toBe("initial-value");
    expect(element.data.value).toBeNull();
  });
});
