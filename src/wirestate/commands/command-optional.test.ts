import { Container } from "inversify";

import { CommandBus } from "@/wirestate/commands/command-bus";
import { commandOptional } from "@/wirestate/commands/command-optional";
import { createIocContainer } from "@/wirestate/container/create-ioc-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/registry";
import { ECommandStatus, ICommandDescriptor } from "@/wirestate/types/commands";
import { Optional } from "@/wirestate/types/general";

describe("commandOptional", () => {
  it("should dispatch a command on the container if handler exists", async () => {
    const container: Container = createIocContainer();
    const handler = jest.fn((data: string) => data + "-result");
    const bus: CommandBus = container.get(COMMAND_BUS_TOKEN);

    bus.register("TEST_COMMAND", handler);

    jest.spyOn(bus, "commandOptional");

    const descriptor: Optional<ICommandDescriptor<string>> = commandOptional(container, "TEST_COMMAND", "data");

    expect(descriptor).not.toBeNull();
    expect(descriptor?.status).toBe(ECommandStatus.PENDING);

    expect(await descriptor?.task).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "data");
  });

  it("should return null if no handler exists", () => {
    const container: Container = createIocContainer();
    const descriptor: Optional<ICommandDescriptor> = commandOptional(container, "NON_EXISTENT", "data");

    expect(descriptor).toBeNull();
  });
});
