import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { EventBus } from "@/wirestate/core/events/event-bus";
import { useEvent } from "@/wirestate-react/events/use-event";
import { EVENT_BUS_TOKEN } from "@/wirestate/core/registry";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("useEvent", () => {
  afterEach(() => {
    cleanup();
  });

  it("should filter by single event type", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EVENT_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("Y", handler);

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "X" }));
    act(() => bus.emit({ type: "Y", payload: 1 }));
    act(() => bus.emit({ type: "Z", payload: { a: 1, b: 2 } }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "Y", payload: 1 });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EVENT_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("X", handler);

      return null;
    }

    act(() => bus.emit({ type: "X" }));

    const { unmount } = render(withIocProvider(<TestComponent />, container));

    act(() => bus.emit({ type: "X" }));
    act(() => bus.emit({ type: "X" }));
    act(() => bus.emit({ type: "X" }));

    expect(handler).toHaveBeenCalledTimes(3);

    unmount();

    act(() => bus.emit({ type: "X" }));
    act(() => bus.emit({ type: "X" }));
    act(() => bus.emit({ type: "X" }));

    expect(handler).toHaveBeenCalledTimes(3);
  });
});
