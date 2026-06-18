import { ReactiveElement } from "@lit/reactive-element";
import { Container, EventBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

import { OnEventController } from "./on-event-controller";

describe("OnEventController", () => {
  @customElement("ws-event-controller-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("tolerates hostDisconnected when nothing was ever subscribed", () => {
    const element: TestConsumerElement = new TestConsumerElement();
    const controller = new OnEventController(element, ["NOOP_EVENT"], () => undefined);

    // Disconnect before any container resolution: cleanup runs with no active subscription.
    expect(() => controller.hostDisconnected()).not.toThrow();
  });

  it("should subscribe when host connects / unsubscribe on disconnect", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnEventController(element, ["TEST_EVENT"], handler);
    expect(bus.hasSubscribers()).toBe(false);

    provider.appendChild(element);
    expect(bus.hasSubscribers()).toBe(true);

    element.remove();
    expect(bus.hasSubscribers()).toBe(false);
  });

  it("should invoke handler with correct event when event is emitted", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnEventController(element, ["DATA_EVENT"], handler);
    provider.appendChild(element);

    bus.emit("DATA_EVENT", "payload");
    bus.emit("OTHER_EVENT", "ignored");

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "DATA_EVENT", payload: "payload" });

    element.remove();
    bus.emit("DATA_EVENT", "after-disconnect");

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should subscribe to all events when types are null", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnEventController(element, null, handler);
    provider.appendChild(element);

    bus.emit("FIRST_EVENT", 1);
    bus.emit("SECOND_EVENT", 2);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, { type: "FIRST_EVENT", payload: 1 });
    expect(handler).toHaveBeenNthCalledWith(2, { type: "SECOND_EVENT", payload: 2 });
  });

  it("should unsubscribe from the previous container when container context is updated", () => {
    const { provider, contextProvider, container: firstContainer } = fixture;

    const firstBus: EventBus = firstContainer.get(EventBus);
    const secondContainer: Container = new Container({ bindings: [EventBus] });
    const secondBus: EventBus = secondContainer.get(EventBus);

    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnEventController(element, ["REVISION_EVENT"], handler);

    provider.appendChild(element);
    firstBus.emit("REVISION_EVENT", "first");

    expect(handler).toHaveBeenCalledWith({ type: "REVISION_EVENT", payload: "first" });

    contextProvider.setValue(secondContainer);
    firstBus.emit("REVISION_EVENT", "stale");
    secondBus.emit("REVISION_EVENT", "second");

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith({ type: "REVISION_EVENT", payload: "second" });

    element.remove();

    firstBus.emit("REVISION_EVENT", "stale");
    secondBus.emit("REVISION_EVENT", "stale");

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
