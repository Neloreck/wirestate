import { ReactiveElement } from "@lit/reactive-element";
import { QueryBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { OnQueryController } from "./on-query-controller";
import { useOnQuery } from "./use-on-query";

describe("useOnQuery hook", () => {
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
    const handler = jest.fn((data: string) => "hook-" + data);
    const controller = useOnQuery(element, { type: "TEST_QUERY", handler });

    expect(controller).toBeInstanceOf(OnQueryController);
    expect(bus.has("TEST_QUERY")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_QUERY")).toBe(true);

    element.remove();
    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should call handler with correct data via hook", async () => {
    const { provider, container } = fixture;

    const bus: QueryBus = container.get(QueryBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: number) => data + 100);

    useOnQuery(element, { type: "TEST_QUERY_DATA", handler });

    provider.appendChild(element);

    expect(await bus.query("TEST_QUERY_DATA", 5)).toBe(105);
    expect(handler).toHaveBeenCalledWith(5);
  });
});
