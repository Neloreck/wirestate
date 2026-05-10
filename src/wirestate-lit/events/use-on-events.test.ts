import { ReactiveElement } from "@lit/reactive-element";
import { EventBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { OnEventController } from "./on-event-controller";
import { useOnEvents } from "./use-on-events";

describe("useOnEvents", () => {
  @customElement("ws-event-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should subscribe to events via hook", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();
    const controller = useOnEvents(element, { handler, types: null });

    expect(controller).toBeInstanceOf(OnEventController);

    provider.appendChild(element);

    bus.emit({ type: "TEST_EVENT", payload: "test-payload" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "TEST_EVENT", payload: "test-payload" });

    element.remove();

    bus.emit({ type: "TEST_EVENT" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should filter events by type via hook", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    useOnEvents(element, { handler, types: "SPECIFIC_EVENT_TYPE" });

    provider.appendChild(element);

    bus.emit({ type: "OTHER" });
    expect(handler).not.toHaveBeenCalled();

    bus.emit({ type: "SPECIFIC_EVENT_TYPE" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple event types via hook", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    useOnEvents(element, { handler, types: ["A", "B"] });

    provider.appendChild(element);

    bus.emit({ type: "C" });
    expect(handler).not.toHaveBeenCalled();

    bus.emit({ type: "A" });
    expect(handler).toHaveBeenCalledTimes(1);

    bus.emit({ type: "B" });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("should handle undefined types as null (all events)", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    useOnEvents(element, { handler });

    provider.appendChild(element);

    bus.emit({ type: "ANY_EVENT" });
    expect(handler).toHaveBeenCalledTimes(1);

    bus.emit({ type: "ANOTHER_EVENT" });
    expect(handler).toHaveBeenCalledTimes(2);

    bus.emit({ type: "AND_ANOTHER_EVENT" });
    expect(handler).toHaveBeenCalledTimes(3);
  });
});
