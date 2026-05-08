import { Container } from "inversify";

import { command } from "@/wirestate-core/commands/command";
import { CommandBus } from "@/wirestate-core/commands/command-bus";
import { createIocContainer } from "@/wirestate-core/container/create-ioc-container";
import { CommandStatus, CommandDescriptor } from "@/wirestate-core/types/commands";

describe("command", () => {
  it("should dispatch a command on the container", async () => {
    const container: Container = createIocContainer();
    const handler = jest.fn((data: string) => data + "-result");
    const bus: CommandBus = container.get(CommandBus);

    bus.register("TEST_COMMAND", handler);

    jest.spyOn(bus, "command");

    const descriptor: CommandDescriptor<string> = command(container, "TEST_COMMAND", "data");

    expect(descriptor.status).toBe(CommandStatus.PENDING);

    expect(await descriptor.task).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "data");
  });
});
