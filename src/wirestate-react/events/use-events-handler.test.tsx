import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus, createContainer } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useEventsHandler } from "./use-events-handler";

describe("useEventsHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to all events without filtering", () => {
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent(): null {
      useEventsHandler(handler);

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    act(() => bus.emit("A", "A-DATA"));
    act(() => bus.emit("B", "B-DATA"));
    act(() => bus.emit("C", "C-DATA"));

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenCalledWith({ type: "A", payload: "A-DATA" });
    expect(handler).toHaveBeenCalledWith({ type: "B", payload: "B-DATA" });
    expect(handler).toHaveBeenCalledWith({ type: "C", payload: "C-DATA" });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEventsHandler(handler);

      return null;
    }

    act(() => bus.emit("H"));

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

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
    const container: Container = createContainer();
    const bus: EventBus = container.get(EventBus);

    const handler1 = jest.fn();
    const handler2 = jest.fn();

    function TestComponent({ fire, handler }: { fire: boolean; handler: jest.Mock }) {
      useEventsHandler(handler);

      useLayoutEffect(() => {
        if (fire) {
          bus.emit("A", "payload");
        }
      }, [fire]);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent fire={false} handler={handler1} />, container));

    rerender(withContainerProvider(<TestComponent fire={true} handler={handler2} />, container));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith({ type: "A", payload: "payload" });
  });
});
