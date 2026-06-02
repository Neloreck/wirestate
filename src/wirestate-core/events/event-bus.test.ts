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

  it("should omit payload and source fields when they are undefined", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("TEST", undefined, {});

    const event = handler.mock.calls[0][0];

    expect(event).toStrictEqual({ type: "TEST" });
    expect(Object.prototype.hasOwnProperty.call(event, "payload")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(event, "source")).toBe(false);
  });

  it("should omit only undefined fields while preserving provided fields", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("TEST_WITH_SOURCE", undefined, { source: "source" });
    bus.emit("TEST_WITH_PAYLOAD", 42, {});

    const sourceEvent = handler.mock.calls[0][0];
    const payloadEvent = handler.mock.calls[1][0];

    expect(sourceEvent).toStrictEqual({ type: "TEST_WITH_SOURCE", source: "source" });
    expect(Object.prototype.hasOwnProperty.call(sourceEvent, "payload")).toBe(false);

    expect(payloadEvent).toStrictEqual({ type: "TEST_WITH_PAYLOAD", payload: 42 });
    expect(Object.prototype.hasOwnProperty.call(payloadEvent, "source")).toBe(false);
  });

  it("should preserve falsy payload and source values when they are not undefined", () => {
    const bus: EventBus = new EventBus();
    const handler = jest.fn();

    bus.subscribe(handler);
    bus.emit("NULL_VALUES", null, { source: null });
    bus.emit("ZERO_VALUES", 0, { source: 0 });
    bus.emit("FALSE_VALUES", false, { source: false });

    expect(handler).toHaveBeenNthCalledWith(1, { type: "NULL_VALUES", payload: null, source: null });
    expect(handler).toHaveBeenNthCalledWith(2, { type: "ZERO_VALUES", payload: 0, source: 0 });
    expect(handler).toHaveBeenNthCalledWith(3, { type: "FALSE_VALUES", payload: false, source: false });
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

  describe("type-indexed subscriptions", () => {
    it("should only deliver matching events to a single-type subscriber", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe("A", handler);

      bus.emit("B", 1);
      bus.emit("A", 2);
      bus.emit("C", 3);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: "A", payload: 2 });
    });

    it("should deliver matching events to a multi-type subscriber", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(["A", "B"], handler);

      bus.emit("A");
      bus.emit("B");
      bus.emit("C");

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, { type: "A" });
      expect(handler).toHaveBeenNthCalledWith(2, { type: "B" });
    });

    it("should treat an 0 type list as a catch-all subscription", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(0, handler);

      bus.emit("A");
      bus.emit("B");
      bus.emit(0);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should treat an undefined type list as a catch-all subscription", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(handler);

      bus.emit("A");
      bus.emit("B");

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should treat a null type list as a catch-all subscription", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(null, handler);

      bus.emit("A");
      bus.emit("B");

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should not deliver events to an empty type list subscriber", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe([], handler);

      bus.emit("A");
      bus.emit("B");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should deduplicate repeated types and invoke the handler once per emit", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(["DUPLICATED", "DUPLICATED"], handler);
      bus.emit("DUPLICATED");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should run catch-all handlers before type-specific handlers", () => {
      const bus: EventBus = new EventBus();
      const calls: Array<string> = [];

      bus.subscribe("TYPED", () => calls.push("TYPED"));
      bus.subscribe((event) => calls.push(`all:${String(event.type)}`));

      bus.emit("TYPED");

      expect(calls).toEqual(["all:TYPED", "TYPED"]);
    });

    it("should unsubscribe a typed handler via the returned function", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      const unsubscribe: EventUnsubscriber = bus.subscribe(["A", "B"], handler);

      unsubscribe();
      bus.emit("A");
      bus.emit("B");

      expect(handler).not.toHaveBeenCalled();
      expect(bus.hasSubscribers()).toBe(false);
    });

    it("should keep a shared type bucket alive until its last handler unsubscribes", () => {
      const bus: EventBus = new EventBus();
      const first = jest.fn();
      const second = jest.fn();

      const unsubscribeFirst: EventUnsubscriber = bus.subscribe("SHARED", first);

      bus.subscribe("SHARED", second);

      unsubscribeFirst();
      bus.emit("SHARED");

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      expect(bus.hasSubscribers()).toBe(true);
    });

    it("should report typed handler errors without stopping other handlers", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const bus: EventBus = new EventBus();

      const survivor = jest.fn();
      const failing = jest.fn().mockImplementation(() => {
        throw new Error("typed handler error");
      });

      bus.subscribe("THROW", failing);
      bus.subscribe("THROW", survivor);
      bus.emit("THROW");

      expect(failing).toHaveBeenCalledTimes(1);
      expect(survivor).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith("[wirestate] Event handler threw:", expect.any(Error));

      errorSpy.mockRestore();
    });

    it("should not invoke handlers subscribed during the same emit", () => {
      const bus: EventBus = new EventBus();
      const late = jest.fn();

      bus.subscribe("CHAIN", () => {
        bus.subscribe("CHAIN", late);
      });

      bus.emit("CHAIN");

      expect(late).not.toHaveBeenCalled();

      bus.emit("CHAIN");

      expect(late).toHaveBeenCalledTimes(1);
    });

    it("should allow a handler to unsubscribe itself during emit", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      const unsubscribe: EventUnsubscriber = bus.subscribe("ONCE", () => {
        handler();
        unsubscribe();
      });

      bus.emit("ONCE");
      bus.emit("ONCE");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should report no subscribers once all typed and catch-all handlers are removed", () => {
      const bus: EventBus = new EventBus();

      const unsubscribeTyped: EventUnsubscriber = bus.subscribe("A", jest.fn());
      const unsubscribeCatchAll: EventUnsubscriber = bus.subscribe(jest.fn());

      expect(bus.hasSubscribers()).toBe(true);

      unsubscribeTyped();
      expect(bus.hasSubscribers()).toBe(true);

      unsubscribeCatchAll();
      expect(bus.hasSubscribers()).toBe(false);
    });
  });

  describe("registration identity", () => {
    it("should deliver an event once per separate subscription of the same handler", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe("A", handler);
      bus.subscribe("A", handler);

      bus.emit("A");

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should remove only its own subscription via the returned unsubscriber", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      const unsubscribeFirst: EventUnsubscriber = bus.subscribe("A", handler);

      bus.subscribe("A", handler);

      unsubscribeFirst();
      bus.emit("A");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should manage overlapping multi-type subscriptions of one handler independently", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      const unsubscribeFirst: EventUnsubscriber = bus.subscribe(["A", "B"], handler);

      bus.subscribe(["B", "C"], handler);

      // Removing the first subscription must not disturb the second's "B".
      unsubscribeFirst();

      bus.emit("A");
      bus.emit("B");
      bus.emit("C");

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith({ type: "B" });
      expect(handler).toHaveBeenCalledWith({ type: "C" });
    });

    it("should remove a handler only for the given types via unsubscribe(types, handler)", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(["A", "B"], handler);
      bus.unsubscribe(["A"], handler);

      bus.emit("A");
      bus.emit("B");

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: "B" });
    });

    it("should remove only one subscription per unsubscribe(type, handler) call", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      const unsubscribeFirst = bus.subscribe("A", handler);

      bus.subscribe("A", handler);

      bus.unsubscribe("A", handler);
      bus.emit("A");

      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribeFirst();
      bus.emit("A");

      expect(handler).toHaveBeenCalledTimes(1);
      expect(bus.hasSubscribers()).toBe(false);
    });

    it("should not let catch-all unsubscribe touch typed subscriptions", () => {
      const bus: EventBus = new EventBus();
      const handler = jest.fn();

      bus.subscribe(handler);
      bus.subscribe("A", handler);

      bus.unsubscribe(handler);

      bus.emit("A");

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
