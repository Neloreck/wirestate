import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { useSignals } from "@/wirestate/core/signals/use-signals";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";

describe("useSignals", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to multiple signal types", () => {
    const container: Container = mockContainer();
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);

    const handler = jest.fn();

    const TestComponent = () => {
      useSignals(["X", "Y"], handler);

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
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useSignals(["A", "B"], handler);

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
