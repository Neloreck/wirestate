import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { EVENT_BUS, EventBus } from "@/wirestate";
import { mockContainer } from "@/wirestate/test-utils";
import { useEvents } from "@/wirestate-react/events/use-events";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("useEvents", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to multiple event types", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EVENT_BUS);

    const handler = jest.fn();

    const TestComponent = () => {
      useEvents(["X", "Y"], handler);

      return null;
    };

    render(withIocProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "V", payload: { a: "v", b: 1 } }));
    act(() => bus.emit({ type: "W", payload: { a: "w", b: 2 } }));
    act(() => bus.emit({ type: "X", payload: { a: "x", b: 3 } }));
    act(() => bus.emit({ type: "Y", payload: { a: "y", b: 4 } }));
    act(() => bus.emit({ type: "Z", payload: { a: "z", b: 5 } }));

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith({ type: "X", payload: { a: "x", b: 3 } });
    expect(handler).toHaveBeenCalledWith({ type: "Y", payload: { a: "y", b: 4 } });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EVENT_BUS);
    const handler = jest.fn();

    function TestComponent() {
      useEvents(["A", "B"], handler);

      return null;
    }

    act(() => bus.emit({ type: "A" }));
    act(() => bus.emit({ type: "B" }));
    act(() => bus.emit({ type: "C" }));

    const { unmount } = render(withIocProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "A" }));
    act(() => bus.emit({ type: "B" }));
    act(() => bus.emit({ type: "C" }));

    expect(handler).toHaveBeenCalledTimes(2);

    unmount();

    act(() => bus.emit({ type: "A" }));
    act(() => bus.emit({ type: "B" }));
    act(() => bus.emit({ type: "C" }));

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
