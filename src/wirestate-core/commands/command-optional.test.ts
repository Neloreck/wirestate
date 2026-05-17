import { Container } from "inversify";

import { mockContainer } from "../test-utils/mock-container";
import { CommandStatus, CommandDescriptor } from "../types/commands";
import { Optional } from "../types/general";

import { CommandBus } from "./command-bus";
import { commandOptional } from "./command-optional";

describe("commandOptional", () => {
  it("should dispatch a command on the container if handler exists", async () => {
    const container: Container = mockContainer();
    const handler = jest.fn((data: string) => data + "-result");
    const bus: CommandBus = container.get(CommandBus);

    bus.register("TEST_COMMAND", handler);

    jest.spyOn(bus, "commandOptional");

    const descriptor: Optional<CommandDescriptor<string>> = commandOptional(container, "TEST_COMMAND", "data");

    expect(descriptor).not.toBeNull();
    expect(descriptor?.status).toBe(CommandStatus.PENDING);

    expect(await descriptor?.task).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "data");
  });

  it("should return null if no handler exists", () => {
    const container: Container = mockContainer();
    const descriptor: Optional<CommandDescriptor> = commandOptional(container, "NON_EXISTENT", "data");

    expect(descriptor).toBeNull();
  });
});
