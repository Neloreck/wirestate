import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { useSignal } from "@/wirestate/core/signals/use-signal";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";

describe("useSignal", () => {
  afterEach(() => {
    cleanup();
  });

  it("should filter by single signal type", () => {
    const container: Container = mockContainer();
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useSignal("Y", handler);

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
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useSignal("X", handler);

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
