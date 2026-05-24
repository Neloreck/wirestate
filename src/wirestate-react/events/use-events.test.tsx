import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useEvents } from "./use-events";

describe("useEvents", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to multiple event types", () => {
    const container: Container = mockContainer();
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
    const container: Container = mockContainer();
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
});
