import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import { CommandBus, createIocContainer, CommandDescriptor, COMMAND_BUS, CommandHandler } from "@/wirestate-core";
import { useCommandHandler } from "@/wirestate-react/commands/use-command-handler";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = createIocContainer();
    const commandBus: CommandBus = container.get(COMMAND_BUS);
    const handler = jest.fn(() => Promise.resolve("async-data"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(withIocProvider(<TestComponent />, container));

    expect(commandBus.has("HOOK_COMMAND")).toBe(true);

    const descriptor: CommandDescriptor = commandBus.command("HOOK_COMMAND", "data");

    await descriptor.task;

    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);
    expect(await descriptor.task).toBe("async-data");
  });

  it("should update handler ref when handler changes", async () => {
    const container: Container = createIocContainer();
    const commandBus: CommandBus = container.get(COMMAND_BUS);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ handler }: Record<string, unknown>) {
      useCommandHandler("UPDATE_COMMAND", handler as CommandHandler);

      return null;
    }

    const { rerender } = render(withIocProvider(<TestComponent handler={handler1} />, container));

    await commandBus.command("UPDATE_COMMAND").task;
    expect(handler1).toHaveBeenCalled();

    rerender(withIocProvider(<TestComponent handler={handler2} />, container));

    await commandBus.command("UPDATE_COMMAND").task;
    expect(handler2).toHaveBeenCalled();
  });
});
