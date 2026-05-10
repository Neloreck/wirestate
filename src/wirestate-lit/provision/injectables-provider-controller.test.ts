import { ReactiveElement } from "@lit/reactive-element";
import { Injectable } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { GenericService } from "@/fixtures/services/generic-service";

import { IocContext } from "../context/ioc-context";
import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { InjectablesProviderController } from "./injectables-provider-controller";

describe("InjectablesProviderController", () => {
  @Injectable()
  class EagerInjectableService {
    public activated: boolean = false;

    public constructor() {
      this.activated = true;
    }
  }

  @customElement("ws-injectables-consumer")
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

    new InjectablesProviderController(element, { entries: [GenericService] });

    expect(container.isBound(GenericService)).toBe(false);

    provider.appendChild(element);
    expect(container.isBound(GenericService)).toBe(true);
    expect(container.get(GenericService)).toBeInstanceOf(GenericService);

    element.remove();
    expect(container.isBound(GenericService)).toBe(false);
  });

  it("should activate services eagerly when activate option is provided", () => {
    const { provider, container } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();
    const activateSpy = jest.spyOn(container, "get");

    new InjectablesProviderController(element, {
      entries: [GenericService, EagerInjectableService],
      activate: [EagerInjectableService],
    });

    provider.appendChild(element);

    expect(activateSpy).toHaveBeenCalledWith(EagerInjectableService);
    expect(container.get(EagerInjectableService)).toBeInstanceOf(EagerInjectableService);
  });

  it("should not activate entries without activate option", () => {
    const { provider, container } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();
    const getSpy = jest.spyOn(container, "get");

    new InjectablesProviderController(element, {
      entries: [GenericService, EagerInjectableService],
    });

    provider.appendChild(element);

    expect(getSpy).not.toHaveBeenCalledWith(GenericService);
    expect(container.isBound(GenericService)).toBe(true);
  });

  it("should bind to the context provided via 'into' option instead of the consumer context", () => {
    const { provider, container: consumerContainer } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();
    const intoContext: IocContext = {
      container: mockContainer(),
      revision: 1,
      nextRevision: () => 1,
    };

    new InjectablesProviderController(element, {
      entries: [GenericService],
      into: intoContext,
    });

    provider.appendChild(element);

    expect(intoContext.container.isBound(GenericService)).toBe(true);
    expect(consumerContainer.isBound(GenericService)).toBe(false);

    element.remove();
    expect(intoContext.container.isBound(GenericService)).toBe(false);
    expect(consumerContainer.isBound(GenericService)).toBe(false);
  });

  it("should support 'into' as a resolver function", () => {
    const { container, provider } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();
    const intoContext: IocContext = {
      container: mockContainer(),
      revision: 1,
      nextRevision: () => 1,
    };

    new InjectablesProviderController(element, {
      entries: [GenericService],
      into: () => intoContext,
    });

    provider.appendChild(element);
    expect(intoContext.container.isBound(GenericService)).toBe(true);
    expect(container.isBound(GenericService)).toBe(false);

    element.remove();
    expect(intoContext.container.isBound(GenericService)).toBe(false);
    expect(container.isBound(GenericService)).toBe(false);
  });

  it("should throw a meaningful error when 'into' resolves to null", () => {
    const { provider } = fixture;

    const element: TestConsumerElement = new TestConsumerElement();

    new InjectablesProviderController(element, {
      entries: [GenericService],
      into: () => null as unknown as IocContext,
    });

    expect(() => provider.appendChild(element)).toThrow(
      "InjectablesProviderController: the 'into' option resolved to null or undefined. Ensure the value or resolver function returns a valid IocContext."
    );
  });

  it("should not throw when disconnected without prior context (no provider in tree)", () => {
    const element: TestConsumerElement = new TestConsumerElement();

    new InjectablesProviderController(element, { entries: [GenericService] });

    // Append outside provider: consumer never fires, boundContext stays null
    document.body.appendChild(element);
    expect(() => element.remove()).not.toThrow();
  });

  it("should re-bind entries after element reconnects", () => {
    const { provider, container } = fixture;
    const element = new TestConsumerElement();

    new InjectablesProviderController(element, { entries: [GenericService] });

    provider.appendChild(element);
    expect(container.isBound(GenericService)).toBe(true);

    element.remove();
    expect(container.isBound(GenericService)).toBe(false);

    // Reconnect — controller should bind again.
    provider.appendChild(element);
    expect(container.isBound(GenericService)).toBe(true);

    element.remove();
    expect(container.isBound(GenericService)).toBe(false);
  });
});
