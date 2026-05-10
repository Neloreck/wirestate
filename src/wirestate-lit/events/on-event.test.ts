import { ReactiveElement } from "@lit/reactive-element";
import { EventBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { onEvent } from "./on-event";

describe("onEvent", () => {
  @customElement("ws-on-event-test-component")
  class DecoratedEventElement extends ReactiveElement {
    @onEvent()
    public onAllEvents(): void {
      return void 0;
    }

    @onEvent("SPECIFIC_EVENT")
    public onSpecificEvent(): void {
      return void 0;
    }

    @onEvent(["EVENT_A", "EVENT_B"])
    public onMultipleEvents(): void {
      return void 0;
    }
  }

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should subscribe to events on connect and unsubscribe on disconnect", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: DecoratedEventElement = new DecoratedEventElement();

    expect(bus.has()).toBe(false);

    provider.appendChild(element);
    expect(bus.has()).toBe(true);

    element.remove();
    expect(bus.has()).toBe(false);
  });

  it("should handle specific event types", () => {
    const { provider, container } = fixture;

    const bus: EventBus = container.get(EventBus);
    const element: DecoratedEventElement = new DecoratedEventElement();

    provider.appendChild(element);

    jest.spyOn(element, "onAllEvents");
    jest.spyOn(element, "onMultipleEvents");
    jest.spyOn(element, "onSpecificEvent");

    bus.emit({ type: "SPECIFIC_EVENT", payload: 10 });

    expect(element.onSpecificEvent).toHaveBeenCalledTimes(1);
    expect(element.onSpecificEvent).toHaveBeenCalledWith({ type: "SPECIFIC_EVENT", payload: 10 });
    expect(element.onAllEvents).toHaveBeenCalledTimes(1);
    expect(element.onAllEvents).toHaveBeenCalledWith({ type: "SPECIFIC_EVENT", payload: 10 });
    expect(element.onMultipleEvents).toHaveBeenCalledTimes(0);

    bus.emit({ type: "OTHER_EVENT" });

    expect(element.onAllEvents).toHaveBeenCalledTimes(2);
    expect(element.onAllEvents).toHaveBeenCalledWith({ type: "OTHER_EVENT" });
    expect(element.onSpecificEvent).toHaveBeenCalledTimes(1);
    expect(element.onMultipleEvents).toHaveBeenCalledTimes(0);

    bus.emit({ type: "EVENT_A", payload: "event-a-payload" });

    expect(element.onMultipleEvents).toHaveBeenCalledTimes(1);
    expect(element.onMultipleEvents).toHaveBeenCalledWith({ type: "EVENT_A", payload: "event-a-payload" });
    expect(element.onAllEvents).toHaveBeenCalledTimes(3);
    expect(element.onSpecificEvent).toHaveBeenCalledTimes(1);

    bus.emit({ type: "EVENT_B", payload: "event-b-payload" });

    expect(element.onMultipleEvents).toHaveBeenCalledTimes(2);
    expect(element.onMultipleEvents).toHaveBeenCalledWith({ type: "EVENT_B", payload: "event-b-payload" });
    expect(element.onAllEvents).toHaveBeenCalledTimes(4);
    expect(element.onSpecificEvent).toHaveBeenCalledTimes(1);
  });
});
