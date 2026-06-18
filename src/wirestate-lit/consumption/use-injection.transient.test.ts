import { ReactiveElement } from "@lit/reactive-element";
import { BindingType, Container, Injectable } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { useInjection } from "./use-injection";

describe("useInjection transient instance binding", () => {
  @Injectable()
  class CounterService {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    const container: Container = new Container();

    container.bind({ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" });

    fixture = createLitProvision(container);
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should resolve a fresh transient instance per element", () => {
    @customElement("test-transient-injection-a-element")
    class TransientAElement extends ReactiveElement {
      public service = useInjection(this, CounterService);
    }

    @customElement("test-transient-injection-b-element")
    class TransientBElement extends ReactiveElement {
      public service = useInjection(this, CounterService);
    }

    const a = new TransientAElement();
    const b = new TransientBElement();

    fixture.provider.appendChild(a);
    fixture.provider.appendChild(b);

    expect(a.service.value).toBeInstanceOf(CounterService);
    expect(b.service.value).toBeInstanceOf(CounterService);
    // Each element resolves independently, so a transient yields distinct instances.
    expect(a.service.value).not.toBe(b.service.value);
  });
});
