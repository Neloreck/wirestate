import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useEventsHandler } from "./use-events-handler";

describe("useEventsHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to all events without filtering", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent(): null {
      useEventsHandler(handler);

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "A", payload: "A-DATA" }));
    act(() => bus.emit({ type: "B", payload: "B-DATA" }));
    act(() => bus.emit({ type: "C", payload: "C-DATA" }));

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenCalledWith({ type: "A", payload: "A-DATA" });
    expect(handler).toHaveBeenCalledWith({ type: "B", payload: "B-DATA" });
    expect(handler).toHaveBeenCalledWith({ type: "C", payload: "C-DATA" });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEventsHandler(handler);

      return null;
    }

    act(() => bus.emit({ type: "H" }));

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "H" }));
    act(() => bus.emit({ type: "H" }));
    act(() => bus.emit({ type: "H" }));

    expect(handler).toHaveBeenCalledTimes(3);

    unmount();

    act(() => bus.emit({ type: "H" }));
    act(() => bus.emit({ type: "H" }));
    act(() => bus.emit({ type: "H" }));

    expect(handler).toHaveBeenCalledTimes(3);
  });
});
