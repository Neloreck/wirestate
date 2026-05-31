import { createContainer } from "../container/create-container";
import { EventUnsubscriber } from "../types/events";

import { EventBus } from "./event-bus";

describe("EventBus", () => {
  it("should emit event to subscribed handler", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("TEST", 42);

    expect(handler).toHaveBeenCalledWith({ type: "TEST", payload: 42 });
  });

  it("should omit payload and from fields when they are undefined", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("TEST", undefined, {});

    const event = handler.mock.calls[0][0];

    expect(event).toStrictEqual({ type: "TEST" });
    expect(Object.prototype.hasOwnProperty.call(event, "payload")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(event, "from")).toBe(false);
  });

  it("should omit only undefined fields while preserving provided fields", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("TEST_WITH_SOURCE", undefined, { from: "source" });
    bus.emit("TEST_WITH_PAYLOAD", 42, {});

    const sourceEvent = handler.mock.calls[0][0];
    const payloadEvent = handler.mock.calls[1][0];

    expect(sourceEvent).toStrictEqual({ type: "TEST_WITH_SOURCE", from: "source" });
    expect(Object.prototype.hasOwnProperty.call(sourceEvent, "payload")).toBe(false);

    expect(payloadEvent).toStrictEqual({ type: "TEST_WITH_PAYLOAD", payload: 42 });
    expect(Object.prototype.hasOwnProperty.call(payloadEvent, "from")).toBe(false);
  });

  it("should preserve falsy payload and from values when they are not undefined", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("NULL_VALUES", null, { from: null });
    bus.emit("ZERO_VALUES", 0, { from: 0 });
    bus.emit("FALSE_VALUES", false, { from: false });

    expect(handler).toHaveBeenNthCalledWith(1, { type: "NULL_VALUES", payload: null, from: null });
    expect(handler).toHaveBeenNthCalledWith(2, { type: "ZERO_VALUES", payload: 0, from: 0 });
    expect(handler).toHaveBeenNthCalledWith(3, { type: "FALSE_VALUES", payload: false, from: false });
  });

  it("should support multiple subscribers", () => {
    const bus: EventBus = new EventBus();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    bus.subscribe(handler1);
    bus.subscribe(handler2);
    bus.emit("TEST");

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe handler", () => {
    const bus = new EventBus();
    const handler = jest.fn();

    const unsubscribe: EventUnsubscriber = bus.subscribe(handler);

    unsubscribe();
    bus.emit("TEST");

    expect(handler).not.toHaveBeenCalled();
  });

  it("should catch handler errors without affecting other handlers", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const bus: EventBus = new EventBus();

    const firstHandler = jest.fn();
    const secondHandler = jest.fn();
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error("handler error");
    });

    bus.subscribe(firstHandler);
    bus.subscribe(errorHandler);
    bus.subscribe(secondHandler);
    bus.emit("TEST");

    expect(firstHandler).toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalled();

    expect(errorSpy).toHaveBeenCalledWith("[wirestate] Event handler threw:", expect.any(Error));

    errorSpy.mockRestore();
  });

  it("should unsubscribe handler by reference", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.unsubscribe(handler);

    bus.emit("TEST");
    bus.emit("TEST");

    expect(handler).not.toHaveBeenCalled();
  });

  it("should not throw when unsubscribing a handler that was not subscribed", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    expect(() => bus.unsubscribe(handler)).not.toThrow();
  });

  it("should only remove the specified handler when multiple are subscribed", () => {
    const bus: EventBus = new EventBus();
    const handlerA = jest.fn();
    const handlerB = jest.fn();

    bus.subscribe(handlerA);
    bus.subscribe(handlerB);
    bus.unsubscribe(handlerA);

    bus.emit("TEST");

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it("should clear all handlers", () => {
    const bus: EventBus = new EventBus();
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    bus.subscribe(firstHandler);
    bus.subscribe(secondHandler);
    bus.clear();
    bus.emit("TEST");

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).not.toHaveBeenCalled();
  });

  it("should report handler errors to container error handler", () => {
    const error = new Error("handler error");
    const onError = jest.fn();
    const container = createContainer({ onError });
    const bus: EventBus = container.get(EventBus);

    bus.subscribe(() => {
      throw error;
    });

    bus.emit("TEST", 42);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        error,
        event: { type: "TEST", payload: 42 },
        message: "Event handler threw",
        source: "event-handler",
      })
    );
  });
});
