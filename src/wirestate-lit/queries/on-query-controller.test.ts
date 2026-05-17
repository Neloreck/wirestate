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

    new OnQueryController(element, "TEST_QRY", handler);
    expect(bus.has("TEST_QRY")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_QRY")).toBe(true);

    element.remove();
    expect(bus.has("TEST_QRY")).toBe(false);
  });

  it("should invoke handler with correct data when query is dispatched", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: string) => data + "-result");

    new OnQueryController(element, "DATA_QRY", handler);
    provider.appendChild(element);

    expect(await bus.query("DATA_QRY", "payload")).toBe("payload-result");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("should support async handlers", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(async (data: number) => data * 3);

    new OnQueryController(element, "ASYNC_QRY", handler);
    provider.appendChild(element);

    expect(await bus.query("ASYNC_QRY", 7)).toBe(21);
  });

  it("should keep handler registered after context revision update", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(() => "test-result");

    const { provider, contextProvider } = createLitProvision(container);

    new OnQueryController(element, "REVISION_QUERY", handler);

    provider.appendChild(element);
    expect(bus.has("REVISION_QUERY")).toBe(true);

    contextProvider.setValue({ ...contextProvider.value, revision: 1000 });
    expect(bus.has("REVISION_QUERY")).toBe(true);

    const newContainer: Container = mockContainer();

    contextProvider.setValue({ ...contextProvider.value, container: newContainer });
    expect(container.get(QueryBus).has("REVISION_QUERY")).toBe(false);
    expect(newContainer.get(QueryBus).has("REVISION_QUERY")).toBe(true);
  });
});
