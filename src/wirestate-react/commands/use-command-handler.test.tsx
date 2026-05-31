import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, CommandHandler, createContainer } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useCommandHandler } from "./use-command-handler";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = createContainer();
    const bus: CommandBus = container.get(CommandBus);
    const handler = jest.fn(() => Promise.resolve("async-data"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(bus.has("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

    expect(bus.has("HOOK_COMMAND")).toBe(true);

    const result: string = await bus.executeAsync<string, string>("HOOK_COMMAND", "data");

    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(bus.has("HOOK_COMMAND")).toBe(false);
    expect(result).toBe("async-data");
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

    const { rerender } = render(withContainerProvider(<TestComponent handler={handler1} />, container));

    bus.execute("UPDATE_COMMAND");
    expect(handler1).toHaveBeenCalled();

    rerender(withContainerProvider(<TestComponent handler={handler2} />, container));

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

    const { rerender } = render(withContainerProvider(<TestComponent fire={false} handler={handler1} />, container));

    rerender(withContainerProvider(<TestComponent fire={true} handler={handler2} />, container));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });
});
