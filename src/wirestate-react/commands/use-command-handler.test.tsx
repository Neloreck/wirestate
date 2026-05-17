import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, createContainer, CommandDescriptor, CommandHandler } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useCommandHandler } from "./use-command-handler";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = createContainer();
    const commandBus: CommandBus = container.get(CommandBus);
    const handler = jest.fn(() => Promise.resolve("async-data"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

    expect(commandBus.has("HOOK_COMMAND")).toBe(true);

    const descriptor: CommandDescriptor = commandBus.command("HOOK_COMMAND", "data");

    await descriptor.task;

    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);
    expect(await descriptor.task).toBe("async-data");
  });

  it("should update handler ref when handler changes", async () => {
    const container: Container = createContainer();
    const commandBus: CommandBus = container.get(CommandBus);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ handler }: Record<string, unknown>) {
      useCommandHandler("UPDATE_COMMAND", handler as CommandHandler);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent handler={handler1} />, container));

    await commandBus.command("UPDATE_COMMAND").task;
    expect(handler1).toHaveBeenCalled();

    rerender(withContainerProvider(<TestComponent handler={handler2} />, container));

    await commandBus.command("UPDATE_COMMAND").task;
    expect(handler2).toHaveBeenCalled();
  });
});
