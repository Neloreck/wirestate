import { Container } from "inversify";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { command } from "@/wirestate/core/container/command";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import { ECommandStatus, ICommandDescriptor } from "@/wirestate/types/commands";

describe("command", () => {
  it("should dispatch a command on the container", async () => {
    const container: Container = createIocContainer();
    const handler = jest.fn((data: string) => data + "-result");
    const bus: CommandBus = container.get(COMMAND_BUS_TOKEN);

    bus.register("TEST_COMMAND", handler);

    jest.spyOn(bus, "command");

    const descriptor: ICommandDescriptor<string> = command(container, "TEST_COMMAND", "data");

    expect(descriptor.status).toBe(ECommandStatus.PENDING);

    expect(await descriptor.task).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "data");
  });
});
