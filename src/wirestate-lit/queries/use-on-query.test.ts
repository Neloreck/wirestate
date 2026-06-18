import { ReactiveElement } from "@lit/reactive-element";
import { QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { OnQueryController } from "./on-query-controller";
import { useOnQuery } from "./use-on-query";

describe("useOnQuery", () => {
  @customElement("ws-query-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should register and unregister handler via hook", () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((payload: string) => "hook-" + payload);
    const controller = useOnQuery(element, { type: "TEST_QUERY", handler });

    expect(controller).toBeInstanceOf(OnQueryController);
    expect(bus.hasHandler("TEST_QUERY")).toBe(false);

    provider.appendChild(element);
    expect(bus.hasHandler("TEST_QUERY")).toBe(true);

    element.remove();
    expect(bus.hasHandler("TEST_QUERY")).toBe(false);
  });

  it("should call handler with correct payload via hook", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((payload: number) => payload + 100);

    useOnQuery(element, { type: "TEST_QUERY_DATA", handler });

    provider.appendChild(element);

    await expect(bus.queryAsync("TEST_QUERY_DATA", 5)).resolves.toBe(105);
    expect(bus.query("TEST_QUERY_DATA", 5)).toBe(105);
    expect(handler).toHaveBeenCalledWith(5);
  });
});
