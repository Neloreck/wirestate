import { ReactiveElement } from "@lit/reactive-element";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { injectablesProvide } from "./injectables-provide";
import { InjectablesProviderController } from "./injectables-provider-controller";

describe("injectablesProvide", () => {
  @customElement("ws-injectables-provider-decorated")
  class DecoratedElement extends ReactiveElement {
    @injectablesProvide({ entries: [GenericService] })
    public servicesProvider!: InjectablesProviderController;
  }

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should bind entries when decorated element connects", () => {
    const { provider, container } = fixture;

    const element: DecoratedElement = new DecoratedElement();

    expect(container.isBound(GenericService)).toBe(false);
    expect(element.servicesProvider).toBeInstanceOf(InjectablesProviderController);

    provider.appendChild(element);
    expect(container.isBound(GenericService)).toBe(true);
    expect(element.servicesProvider).toBeInstanceOf(InjectablesProviderController);

    element.remove();
    expect(container.isBound(GenericService)).toBe(false);
  });
});
