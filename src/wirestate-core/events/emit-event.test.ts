import { Container } from "inversify";

import { mockContainer } from "../test-utils/mock-container";

import { emitEvent } from "./emit-event";
import { EventBus } from "./event-bus";

describe("emitEvent", () => {
  it("should call injected query bus methods with sync data", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);

    jest.spyOn(bus, "emit").mockImplementation(jest.fn());

    emitEvent(container, "SOME_EVENT", 1);

    expect(bus.emit).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith({ type: "SOME_EVENT", payload: 1 });
  });

  it("should call injected query bus methods with only type", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);

    jest.spyOn(bus, "emit").mockImplementation(jest.fn());

    emitEvent(container, "SIMPLE_EVENT");

    expect(bus.emit).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith({ type: "SIMPLE_EVENT", payload: undefined });
  });
});
