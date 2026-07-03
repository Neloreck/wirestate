/**
 * @jest-environment jsdom
 */

import { render, cleanup, act } from "@testing-library/react";
import { type WireEvent, Container, EventBus } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { ContainerProvider } from "../provision/container-provider";
import { type Optional } from "../types/general";

import { useOnEvents } from "./use-on-events";

describe("useOnEvents", () => {
  afterEach(() => {
    cleanup();
  });

  it("should accept a handler typed with a narrowed payload (F-6)", () => {
    type CartEvent = WireEvent<{ id: string }, "CART_ITEM_ADDED">;

    const container: Container = new Container({ bindings: [EventBus] });
    const bus: EventBus = container.get(EventBus);
    const received: Array<Optional<string>> = [];

    function TestComponent() {
      useOnEvents<CartEvent>("CART_ITEM_ADDED", (event) => received.push(event.payload?.id));

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    act(() => bus.emit("CART_ITEM_ADDED", { id: "a1" }));

    expect(received).toEqual(["a1"]);
  });

  describe("single event type", () => {
    it("should filter by single event type", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent() {
        useOnEvents("Y", handler);

        return null;
      }

      render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("X"));
      act(() => bus.emit("Y", 1));
      act(() => bus.emit("z", { a: 1, b: 2 }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: "Y", payload: 1 });
    });

    it("should unsubscribe on unmount", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent() {
        useOnEvents("X", handler);

        return null;
      }

      act(() => bus.emit("X"));

      const { unmount } = render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("X"));
      act(() => bus.emit("X"));
      act(() => bus.emit("X"));

      expect(handler).toHaveBeenCalledTimes(3);

      unmount();

      act(() => bus.emit("X"));
      act(() => bus.emit("X"));
      act(() => bus.emit("X"));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should use latest type and handler when event is emitted during rerender layout effects", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      function TestComponent({ fire, handler, type }: { fire: boolean; handler: jest.Mock; type: string }) {
        useOnEvents(type, handler);

        useLayoutEffect(() => {
          if (fire) {
            bus.emit(type, "payload");
          }
        }, [fire, type]);

        return null;
      }

      const { rerender } = render(
        <ContainerProvider container={container}>
          <TestComponent fire={false} handler={handler1} type={"A"} />
        </ContainerProvider>
      );

      rerender(
        <ContainerProvider container={container}>
          <TestComponent fire={true} handler={handler2} type={"B"} />
        </ContainerProvider>
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ type: "B", payload: "payload" });
    });
  });

  describe("multiple event types", () => {
    it("should subscribe to multiple event types", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);

      const handler = jest.fn();

      const TestComponent = () => {
        useOnEvents(["X", "Y"], handler);

        return null;
      };

      render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("V", { a: "v", b: 1 }));
      act(() => bus.emit("W", { a: "w", b: 2 }));
      act(() => bus.emit("X", { a: "x", b: 3 }));
      act(() => bus.emit("Y", { a: "y", b: 4 }));
      act(() => bus.emit("Z", { a: "z", b: 5 }));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith({ type: "X", payload: { a: "x", b: 3 } });
      expect(handler).toHaveBeenCalledWith({ type: "Y", payload: { a: "y", b: 4 } });
    });

    it("should unsubscribe on unmount", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent() {
        useOnEvents(["A", "B"], handler);

        return null;
      }

      act(() => bus.emit("A"));
      act(() => bus.emit("B"));
      act(() => bus.emit("C"));

      const { unmount } = render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("A"));
      act(() => bus.emit("B"));
      act(() => bus.emit("C"));

      expect(handler).toHaveBeenCalledTimes(2);

      unmount();

      act(() => bus.emit("A"));
      act(() => bus.emit("B"));
      act(() => bus.emit("C"));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should resubscribe when the listened type membership changes", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent({ types }: { types: ReadonlyArray<string> }) {
        useOnEvents(types, handler);

        return null;
      }

      const { rerender } = render(
        <ContainerProvider container={container}>
          <TestComponent types={["A", "B"]} />
        </ContainerProvider>
      );

      act(() => bus.emit("A"));
      act(() => bus.emit("C"));

      expect(handler).toHaveBeenCalledTimes(1);

      rerender(
        <ContainerProvider container={container}>
          <TestComponent types={["B", "C"]} />
        </ContainerProvider>
      );

      act(() => bus.emit("A"));
      act(() => bus.emit("C"));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenLastCalledWith({ type: "C" });
    });

    it("should not leak subscriptions when re-rendered with an equal inline type array", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent() {
        useOnEvents(["A", "B"], handler);

        return null;
      }

      const { rerender } = render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      rerender(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("A"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should use latest types and handler when event is emitted during rerender layout effects", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      function TestComponent({
        fire,
        handler,
        types,
      }: {
        fire: boolean;
        handler: jest.Mock;
        types: ReadonlyArray<string>;
      }) {
        useOnEvents(types, handler);

        useLayoutEffect(() => {
          if (fire) {
            bus.emit("B", "payload");
          }
        }, [fire]);

        return null;
      }

      const { rerender } = render(
        <ContainerProvider container={container}>
          <TestComponent fire={false} handler={handler1} types={["A", "B"]} />
        </ContainerProvider>
      );

      rerender(
        <ContainerProvider container={container}>
          <TestComponent fire={true} handler={handler2} types={["A", "B"]} />
        </ContainerProvider>
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ type: "B", payload: "payload" });
    });
  });

  describe("all events", () => {
    it("should subscribe to all events without filtering when only a handler is passed", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent(): null {
        useOnEvents(handler);

        return null;
      }

      render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("A", "A-DATA"));
      act(() => bus.emit("B", "B-DATA"));
      act(() => bus.emit("C", "C-DATA"));

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenCalledWith({ type: "A", payload: "A-DATA" });
      expect(handler).toHaveBeenCalledWith({ type: "B", payload: "B-DATA" });
      expect(handler).toHaveBeenCalledWith({ type: "C", payload: "C-DATA" });
    });

    it("should unsubscribe on unmount", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);
      const handler = jest.fn();

      function TestComponent() {
        useOnEvents(handler);

        return null;
      }

      act(() => bus.emit("H"));

      const { unmount } = render(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );

      act(() => bus.emit("H"));
      act(() => bus.emit("H"));
      act(() => bus.emit("H"));

      expect(handler).toHaveBeenCalledTimes(3);

      unmount();

      act(() => bus.emit("H"));
      act(() => bus.emit("H"));
      act(() => bus.emit("H"));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should use latest handler when event is emitted during rerender layout effects", () => {
      const container: Container = new Container({ bindings: [EventBus] });
      const bus: EventBus = container.get(EventBus);

      const handler1 = jest.fn();
      const handler2 = jest.fn();

      function TestComponent({ fire, handler }: { fire: boolean; handler: jest.Mock }) {
        useOnEvents(handler);

        useLayoutEffect(() => {
          if (fire) {
            bus.emit("A", "payload");
          }
        }, [fire]);

        return null;
      }

      const { rerender } = render(
        <ContainerProvider container={container}>
          <TestComponent fire={false} handler={handler1} />
        </ContainerProvider>
      );

      rerender(
        <ContainerProvider container={container}>
          <TestComponent fire={true} handler={handler2} />
        </ContainerProvider>
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ type: "A", payload: "payload" });
    });
  });
});
