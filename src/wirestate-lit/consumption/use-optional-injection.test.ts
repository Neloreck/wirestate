import { ReactiveElement } from "@lit/reactive-element";
import { Container, Identifier } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";
import { GenericService } from "@/fixtures/services/generic-service";

import { Optional } from "../types/general";

import { useOptionalInjection } from "./use-optional-injection";

describe("useOptionalInjection", () => {
  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture.cleanup();
  });

  it("should return null when token is not bound", () => {
    const container: Container = new Container();
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
    const container: Container = new Container({
      bindings: [GenericService],
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

  it("should use fallback when token is not bound", () => {
    const container: Container = new Container();
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

  it("should type fallback values separately from injection values", () => {
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-typed-fallback-element")
    class TestTypedFallbackElement extends ReactiveElement {
      public data = useOptionalInjection(this, token, () => 10);
    }

    const element = new TestTypedFallbackElement();

    fixture.provider.appendChild(element);

    const value: string | number = element.data.value;

    expect(value).toBe(10);
    expect(element.data.value).toBe(10);
  });

  it("should provide container to fallback", () => {
    const container: Container = new Container();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind({ token: boundToken, value: "bound-value" });

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
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-options-element")
    class TestOptionsElement extends ReactiveElement {
      public data = useOptionalInjection(this, {
        token,
        fallback: () => "options-fallback",
      });
    }

    const element = new TestOptionsElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("options-fallback");
  });

  it("should use separate fallback parameter with options object", () => {
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-options-parameter-fallback-element")
    class TestOptionsParameterFallbackElement extends ReactiveElement {
      public data = useOptionalInjection(this, { token }, () => 30);
    }

    const element = new TestOptionsParameterFallbackElement();

    fixture.provider.appendChild(element);

    const value: string | number = element.data.value;

    expect(value).toBe(30);
    expect(element.data.value).toBe(30);
  });

  it("should prefer options fallback over separate fallback parameter", () => {
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-options-fallback-priority-element")
    class TestOptionsFallbackPriorityElement extends ReactiveElement {
      public data = useOptionalInjection(
        this,
        {
          token,
          fallback: () => "options-fallback",
        },
        () => "parameter-fallback"
      );
    }

    const element = new TestOptionsFallbackPriorityElement();

    fixture.provider.appendChild(element);

    expect(element.data.value).toBe("options-fallback");
  });

  it("should type fallback values from options object separately from injection values", () => {
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-typed-options-element")
    class TestTypedOptionsElement extends ReactiveElement {
      public data = useOptionalInjection(this, {
        token,
        fallback: () => 20,
      });
    }

    const element = new TestTypedOptionsElement();

    fixture.provider.appendChild(element);

    const value: string | number = element.data.value;

    expect(value).toBe(20);
    expect(element.data.value).toBe(20);
  });

  it("should expose initial value until context resolves", () => {
    const container: Container = new Container();
    const token: Identifier<string> = Symbol("optional-token");

    fixture = createLitProvision(container);

    @customElement("test-use-optional-injection-initial-element")
    class TestInitialElement extends ReactiveElement {
      public data = useOptionalInjection(this, {
        token,
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
