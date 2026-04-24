import { Container } from "inversify";

import { emitSignal } from "@/wirestate/core/container/emit-signal";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { mockContainer } from "@/wirestate/test-utils";

describe("emitSignal", () => {
  it("should call injected query bus methods with sync data", () => {
    const container: Container = mockContainer();
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);

    jest.spyOn(bus, "emit").mockImplementation(jest.fn());

    emitSignal(container, "SOME_SIGNAL", 1);

    expect(bus.emit).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith({ type: "SOME_SIGNAL", payload: 1 });
  });

  it("should call injected query bus methods with only type", () => {
    const container: Container = mockContainer();
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);

    jest.spyOn(bus, "emit").mockImplementation(jest.fn());

    emitSignal(container, "SIMPLE_SIGNAL");

    expect(bus.emit).toHaveBeenCalledTimes(1);
    expect(bus.emit).toHaveBeenCalledWith({ type: "SIMPLE_SIGNAL", payload: undefined });
  });
});
