import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { TSignalUnsubscribe } from "@/wirestate/types/signals";

describe("SignalBus", () => {
  it("should emit signal to subscribed handler", () => {
    const bus: SignalBus = new SignalBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit({ type: "TEST", payload: 42 });

    expect(handler).toHaveBeenCalledWith({ type: "TEST", payload: 42 });
  });

  it("should support multiple subscribers", () => {
    const bus: SignalBus = new SignalBus();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    bus.subscribe(handler1);
    bus.subscribe(handler2);
    bus.emit({ type: "TEST" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe handler", () => {
    const bus = new SignalBus();
    const handler = jest.fn();

    const unsubscribe: TSignalUnsubscribe = bus.subscribe(handler);

    unsubscribe();
    bus.emit({ type: "TEST" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should catch handler errors without affecting other handlers", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const bus: SignalBus = new SignalBus();

    const firstHandler = jest.fn();
    const secondHandler = jest.fn();
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error("handler error");
    });

    bus.subscribe(firstHandler);
    bus.subscribe(errorHandler);
    bus.subscribe(secondHandler);
    bus.emit({ type: "TEST" });

    expect(firstHandler).toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalled();

    expect(errorSpy).toHaveBeenCalledWith("[wirestate] Signal handler threw:", expect.any(Error));

    errorSpy.mockRestore();
  });

  it("should clear all handlers", () => {
    const bus: SignalBus = new SignalBus();
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    bus.subscribe(firstHandler);
    bus.subscribe(secondHandler);
    bus.clear();
    bus.emit({ type: "TEST" });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).not.toHaveBeenCalled();
  });
});
