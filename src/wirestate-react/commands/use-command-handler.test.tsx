import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, CommandHandler, createContainer } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { ContainerProvider } from "../provision/container-provider";

import { useCommandHandler } from "./use-command-handler";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = createContainer();
    const bus: CommandBus = container.get(CommandBus);
    const handler = jest.fn(() => Promise.resolve("async-payload"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(bus.hasHandler("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(bus.hasHandler("HOOK_COMMAND")).toBe(true);

    const result: string = await bus.executeAsync<string, string>("HOOK_COMMAND", "payload");

    expect(handler).toHaveBeenCalledWith("payload");

    unmount();

    expect(bus.hasHandler("HOOK_COMMAND")).toBe(false);
    expect(result).toBe("async-payload");
  });

  it("should update handler ref when handler changes", () => {
    const container: Container = createContainer();
    const bus: CommandBus = container.get(CommandBus);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ handler }: Record<string, unknown>) {
      useCommandHandler("UPDATE_COMMAND", handler as CommandHandler);

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent handler={handler1} />
      </ContainerProvider>
    );

    bus.execute("UPDATE_COMMAND");
    expect(handler1).toHaveBeenCalled();

    rerender(
      <ContainerProvider container={container}>
        <TestComponent handler={handler2} />
      </ContainerProvider>
    );

    bus.execute("UPDATE_COMMAND");
    expect(handler2).toHaveBeenCalled();
  });

  it("should call latest handler when command is dispatched during rerender layout effects", () => {
    const container: Container = createContainer();
    const bus: CommandBus = container.get(CommandBus);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ fire, handler }: { fire: boolean; handler: CommandHandler }) {
      useCommandHandler("IMMEDIATE_COMMAND", handler);

      useLayoutEffect(() => {
        if (fire) {
          bus.execute("IMMEDIATE_COMMAND");
        }
      }, [fire]);

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent fire={false} handler={handler1} />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={container}>
        <TestComponent fire={true} handler={handler2} />
      </ContainerProvider>
    );

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });
});
