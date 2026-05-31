import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus, createContainer } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useEvents } from "./use-events";

describe("useEvents", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to multiple event types", () => {
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);

    const handler = jest.fn();

    const TestComponent = () => {
      useEvents(["X", "Y"], handler);

      return null;
    };

    render(withContainerProvider(<TestComponent />, container));

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
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEvents(["A", "B"], handler);

      return null;
    }

    act(() => bus.emit("A"));
    act(() => bus.emit("B"));
    act(() => bus.emit("C"));

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

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

  it("should use latest types and handler when event is emitted during rerender layout effects", () => {
    const container: Container = createContainer();
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
      useEvents(types, handler);

      useLayoutEffect(() => {
        if (fire) {
          bus.emit("B", "payload");
        }
      }, [fire]);

      return null;
    }

    const { rerender } = render(
      withContainerProvider(<TestComponent fire={false} handler={handler1} types={["A", "B"]} />, container)
    );

    rerender(withContainerProvider(<TestComponent fire={true} handler={handler2} types={["A", "B"]} />, container));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith({ type: "B", payload: "payload" });
  });
});
