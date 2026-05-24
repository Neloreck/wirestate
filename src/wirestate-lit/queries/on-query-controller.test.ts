import { ReactiveElement } from "@lit/reactive-element";
import { QueryBus, Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

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

  it("should register handler when host connects", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnQueryController(element, "TEST_QUERY", handler);
    expect(bus.has("TEST_QUERY")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_QUERY")).toBe(true);

    element.remove();
    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should invoke handler with correct data when query is dispatched", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: string) => data + "-result");

    new OnQueryController(element, "DATA_QUERY", handler);
    provider.appendChild(element);

    expect(bus.query("DATA_QUERY", "payload")).toBe("payload-result");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("should support async handlers", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(async (data: number) => data * 3);

    new OnQueryController(element, "ASYNC_QUERY", handler);
    provider.appendChild(element);

    await expect(bus.queryAsync("ASYNC_QUERY", 7)).resolves.toBe(21);
  });

  it("should re-register when container context is updated", () => {
    const firstContainer: Container = mockContainer();
    const secondContainer: Container = mockContainer();
    const bus: QueryBus = firstContainer.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(() => "test-result");

    const { provider, contextProvider } = createLitProvision(firstContainer);

    new OnQueryController(element, "REVISION_QUERY", handler);

    provider.appendChild(element);
    expect(bus.has("REVISION_QUERY")).toBe(true);

    contextProvider.setValue(secondContainer);
    expect(firstContainer.get(QueryBus).has("REVISION_QUERY")).toBe(false);
    expect(secondContainer.get(QueryBus).has("REVISION_QUERY")).toBe(true);
  });
});
