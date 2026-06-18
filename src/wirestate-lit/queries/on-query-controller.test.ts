import { ReactiveElement } from "@lit/reactive-element";
import { QueryBus, Container } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { OnQueryController } from "./on-query-controller";

describe("OnQueryController", () => {
  @customElement("ws-query-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("tolerates hostDisconnected when nothing was ever registered", () => {
    const element: TestConsumerElement = new TestConsumerElement();
    const controller = new OnQueryController(element, "NOOP_QUERY", () => undefined);

    // Disconnect before any container resolution: cleanup runs with no active registration.
    expect(() => controller.hostDisconnected()).not.toThrow();
  });

  it("should register handler when host connects", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnQueryController(element, "TEST_QUERY", handler);
    expect(bus.hasHandler("TEST_QUERY")).toBe(false);

    provider.appendChild(element);
    expect(bus.hasHandler("TEST_QUERY")).toBe(true);

    element.remove();
    expect(bus.hasHandler("TEST_QUERY")).toBe(false);
  });

  it("should invoke handler with correct payload when query is dispatched", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((payload: string) => payload + "-result");

    new OnQueryController(element, "DATA_QUERY", handler);
    provider.appendChild(element);

    expect(bus.query("DATA_QUERY", "payload")).toBe("payload-result");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("should support async handlers", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(async (payload: number) => payload * 3);

    new OnQueryController(element, "ASYNC_QUERY", handler);
    provider.appendChild(element);

    await expect(bus.queryAsync("ASYNC_QUERY", 7)).resolves.toBe(21);
  });

  it("should re-register when container context is updated", () => {
    const { provider, contextProvider, container: firstContainer } = fixture;

    const QUERY: string = "TEST_QUERY";

    const firstBus: QueryBus = firstContainer.get(QueryBus);
    const secondContainer: Container = new Container({ bindings: [QueryBus] });
    const secondBus: QueryBus = secondContainer.get(QueryBus);

    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(() => "test-result");

    new OnQueryController(element, QUERY, handler);

    expect(firstBus.hasHandler(QUERY)).toBe(false);

    provider.appendChild(element);

    expect(firstBus.hasHandler(QUERY)).toBe(true);
    expect(firstBus.query(QUERY)).toBe("test-result");

    contextProvider.setValue(secondContainer);

    expect(firstBus.hasHandler(QUERY)).toBe(false);
    expect(secondBus.hasHandler(QUERY)).toBe(true);
    expect(secondBus.query(QUERY)).toBe("test-result");

    element.remove();

    expect(firstBus.hasHandler(QUERY)).toBe(false);
    expect(secondBus.hasHandler(QUERY)).toBe(false);
  });
});
