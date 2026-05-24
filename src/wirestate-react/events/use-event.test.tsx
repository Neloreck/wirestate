import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useEvent } from "./use-event";

describe("useEvent", () => {
  afterEach(() => {
    cleanup();
  });

  it("should filter by single event type", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("Y", handler);

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    act(() => bus.emit("X"));
    act(() => bus.emit("Y", 1));
    act(() => bus.emit("z", { a: 1, b: 2 }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "Y", payload: 1 });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("X", handler);

      return null;
    }

    act(() => bus.emit("X"));

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

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
});
