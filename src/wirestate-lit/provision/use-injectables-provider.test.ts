import { ReactiveElement } from "@lit/reactive-element";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { InjectablesProviderController } from "./injectables-provider-controller";
import { useInjectablesProvider } from "./use-injectables-provider";

describe("useInjectablesProvider hook", () => {
  @customElement("ws-use-injectables-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should bind entries when host connects and unbind when it disconnects", () => {
    const { provider, container } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();
    const controller = useInjectablesProvider(element, { entries: [GenericService] });

    expect(controller).toBeInstanceOf(InjectablesProviderController);
    expect(container.isBound(GenericService)).toBe(false);

    provider.appendChild(element);
    expect(container.isBound(GenericService)).toBe(true);
    expect(container.get(GenericService)).toBeInstanceOf(GenericService);

    element.remove();
    expect(container.isBound(GenericService)).toBe(false);
  });
});
