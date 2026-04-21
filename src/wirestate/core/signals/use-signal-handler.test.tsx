import { render, cleanup, act } from "@testing-library/react";
import { Container } from "inversify";

import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { useSignalHandler } from "@/wirestate/core/signals/use-signal-handler";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";

describe("useSignalHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should subscribe to all signals without filtering", () => {
    const container: Container = mockContainer();
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent(): null {
      useSignalHandler(handler);

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
    const bus: SignalBus = container.get(SIGNAL_BUS_TOKEN);
    const handler = jest.fn();

    function TestComponent() {
      useSignalHandler(handler);

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
