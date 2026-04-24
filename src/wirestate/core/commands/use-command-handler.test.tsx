import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useCommandHandler } from "@/wirestate/core/commands/use-command-handler";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { ICommandDescriptor } from "@/wirestate/types/commands";
import { TAnyObject } from "@/wirestate/types/general";

describe("useCommandHandler", () => {
  afterEach(() => {
    cleanup();
  });

  it("should register handler and unregister on unmount", async () => {
    const container: Container = createIocContainer();
    const commandBus: CommandBus = container.get(COMMAND_BUS_TOKEN);
    const handler = jest.fn(() => Promise.resolve("async-data"));

    function TestComponent() {
      useCommandHandler("HOOK_COMMAND", handler);

      return null;
    }

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);

    const { unmount } = render(withIocProvider(<TestComponent />, container));

    expect(commandBus.has("HOOK_COMMAND")).toBe(true);

    const descriptor: ICommandDescriptor = commandBus.command("HOOK_COMMAND", "data");

    await descriptor.task;

    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(commandBus.has("HOOK_COMMAND")).toBe(false);
    expect(await descriptor.task).toBe("async-data");
  });

  it("should update handler ref when handler changes", async () => {
    const container: Container = createIocContainer();
    const commandBus: CommandBus = container.get(COMMAND_BUS_TOKEN);

    const handler1 = jest.fn().mockReturnValue("first");
    const handler2 = jest.fn().mockReturnValue("second");

    function TestComponent({ handler }: TAnyObject) {
      useCommandHandler("UPDATE_COMMAND", handler);

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
