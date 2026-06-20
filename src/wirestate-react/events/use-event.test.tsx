/**
 * @jest-environment jsdom
 */

import { render, cleanup, act } from "@testing-library/react";
import { Container, EventBus } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { ContainerProvider } from "../provision/container-provider";

import { useEvent } from "./use-event";

describe("useEvent", () => {
  afterEach(() => {
    cleanup();
  });

  it("should filter by single event type", () => {
    const container: Container = new Container({ bindings: [EventBus] });
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("Y", handler);

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    act(() => bus.emit("X"));
    act(() => bus.emit("Y", 1));
    act(() => bus.emit("z", { a: 1, b: 2 }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "Y", payload: 1 });
  });

  it("should unsubscribe on unmount", () => {
    const container: Container = new Container({ bindings: [EventBus] });
    const bus: EventBus = container.get(EventBus);
    const handler = jest.fn();

    function TestComponent() {
      useEvent("X", handler);

      return null;
    }

    act(() => bus.emit("X"));

    const { unmount } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

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

  it("should use latest type and handler when event is emitted during rerender layout effects", () => {
    const container: Container = new Container({ bindings: [EventBus] });
    const bus: EventBus = container.get(EventBus);
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    function TestComponent({ fire, handler, type }: { fire: boolean; handler: jest.Mock; type: string }) {
      useEvent(type, handler);

      useLayoutEffect(() => {
        if (fire) {
          bus.emit(type, "payload");
        }
      }, [fire, type]);

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent fire={false} handler={handler1} type={"A"} />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={container}>
        <TestComponent fire={true} handler={handler2} type={"B"} />
      </ContainerProvider>
    );

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith({ type: "B", payload: "payload" });
  });
});
