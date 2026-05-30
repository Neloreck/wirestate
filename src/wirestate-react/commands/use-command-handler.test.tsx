import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, CommandExecution, CommandHandler } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { useLayoutEffect } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { Optional } from "../types/general";

import { useCommandHandler } from "./use-command-handler";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = mockContainer();
    const commandBus: CommandBus = container.get(CommandBus);
    const handler = jest.fn(() => Promise.resolve("async-data"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

    expect(commandBus.has("HOOK_COMMAND")).toBe(true);

    const execution: CommandExecution = commandBus.execute("HOOK_COMMAND", "data");

    await execution.result;

    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);
    expect(await execution.result).toBe("async-data");
  });

  it("should update handler ref when handler changes", async () => {
    const container: Container = mockContainer();
    const commandBus: CommandBus = container.get(CommandBus);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ handler }: Record<string, unknown>) {
      useCommandHandler("UPDATE_COMMAND", handler as CommandHandler);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent handler={handler1} />, container));

    await commandBus.execute("UPDATE_COMMAND").result;
    expect(handler1).toHaveBeenCalled();

    rerender(withContainerProvider(<TestComponent handler={handler2} />, container));

    await commandBus.execute("UPDATE_COMMAND").result;
    expect(handler2).toHaveBeenCalled();
  });

  it("should call latest handler when command is dispatched during rerender layout effects", async () => {
    const container: Container = mockContainer();
    const commandBus: CommandBus = container.get(CommandBus);
    let result: Optional<Promise<unknown>> = null;

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ fire, handler }: { fire: boolean; handler: CommandHandler }) {
      useCommandHandler("IMMEDIATE_COMMAND", handler);

      useLayoutEffect(() => {
        if (fire) {
          result = commandBus.execute("IMMEDIATE_COMMAND").result;
        }
      }, [fire]);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent fire={false} handler={handler1} />, container));

    rerender(withContainerProvider(<TestComponent fire={true} handler={handler2} />, container));

    await result;

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });
});
