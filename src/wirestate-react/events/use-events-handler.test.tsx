import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { EVENT_BUS, EventBus } from "@/wirestate";
import { mockContainer } from "@/wirestate/test-utils";
import { useEventsHandler } from "@/wirestate-react/events/use-events-handler";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("useEventsHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to all events without filtering", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EVENT_BUS);
    const handler = jest.fn();

    function TestComponent(): null {
      useEventsHandler(handler);

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

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
    const bus: EventBus = container.get(EVENT_BUS);
    const handler = jest.fn();

    function TestComponent() {
      useEventsHandler(handler);

      return null;
    }

    act(() => bus.emit({ type: "H" }));

    const { unmount } = render(withIocProvider(<TestComponent />, container));

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
