import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { ECommandStatus, ICommandDescriptor, TCommandUnregister } from "@/wirestate/types/commands";

describe("CommandBus", () => {
  it("should register and dispatch a command handler", async () => {
    const bus: CommandBus = new CommandBus();
    const handler = jest.fn().mockReturnValue("result");

    bus.register("TEST", handler);

    const descriptor: ICommandDescriptor<string> = bus.command("TEST", "data");

    expect(descriptor.status).toBe(ECommandStatus.PENDING);

    const result: string = await descriptor.task;

    expect(result).toBe("result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(descriptor.status).toBe(ECommandStatus.SETTLED);
  });

  it("should throw when no handler is registered", () => {
    const bus: CommandBus = new CommandBus();

    expect(() => bus.command("MISSING")).toThrow("No command handler registered in container for type: 'MISSING'.");
  });

  it("should support handler shadowing (stack)", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("TYPE", () => "first");
    bus.register("TYPE", () => "second");

    const descriptor: ICommandDescriptor<string> = bus.command("TYPE");

    expect(await descriptor.task).toBe("second");
  });

  it("should unregister a handler", () => {
    const bus: CommandBus = new CommandBus();

    const unregister: TCommandUnregister = bus.register("TYPE", () => "value");

    expect(bus.has("TYPE")).toBe(true);

    unregister();

    expect(bus.has("TYPE")).toBe(false);
  });

  it("should fall back to previous handler after unregistering top of stack", async () => {
    const bus: CommandBus = new CommandBus();

    const unregisterFirst: TCommandUnregister = bus.register("TYPE", () => "first");
    const unregisterSecond: TCommandUnregister = bus.register("TYPE", () => "second");

    expect(await bus.command("TYPE").task).toBe("second");

    unregisterSecond();
    expect(await bus.command("TYPE").task).toBe("first");

    unregisterFirst();
    expect(() => bus.command("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
  });

  it("should handle async handlers", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("ASYNC", async (data: number) => data * 2);

    const descriptor: ICommandDescriptor<number> = bus.command<number>("ASYNC", 5);

    expect(descriptor.status).toBe(ECommandStatus.PENDING);

    const result: number = await descriptor.task;

    expect(result).toBe(10);
    expect(descriptor.status).toBe(ECommandStatus.SETTLED);
  });

  it("should set error status on handler rejection", async () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("command failed");

    bus.register("FAIL", () => {
      throw error;
    });

    const descriptor: ICommandDescriptor = bus.command("FAIL");

    expect(descriptor.status).toBe(ECommandStatus.PENDING);

    await expect(descriptor.task).rejects.toThrow("command failed");

    expect(descriptor.status).toBe(ECommandStatus.ERROR);
  });

  it("should set error status on async handler rejection", async () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("async failed");

    bus.register("FAIL_ASYNC", async () => {
      throw error;
    });

    const descriptor: ICommandDescriptor = bus.command("FAIL_ASYNC");

    await expect(descriptor.task).rejects.toThrow("async failed");

    expect(descriptor.status).toBe(ECommandStatus.ERROR);
  });

  it("should check if handler exists", () => {
    const bus: CommandBus = new CommandBus();

    expect(bus.has("TYPE")).toBe(false);

    bus.register("TYPE", () => null);

    expect(bus.has("TYPE")).toBe(true);
  });

  it("should clear all handlers", () => {
    const bus: CommandBus = new CommandBus();

    bus.register("A", () => null);
    bus.register("B", () => null);

    bus.clear();

    expect(bus.has("A")).toBe(false);
    expect(bus.has("B")).toBe(false);
  });

  it("should support symbol command types", async () => {
    const bus: CommandBus = new CommandBus();
    const type: unique symbol = Symbol("command");

    bus.register(type, () => "symbol-result");

    const descriptor: ICommandDescriptor<string> = bus.command(type);

    expect(await descriptor.task).toBe("symbol-result");
  });

  describe("commandOptional", () => {
    it("should return descriptor when handler exists", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("TYPE", () => "value");

      const descriptor = bus.commandOptional("TYPE");

      expect(descriptor).not.toBeNull();
      expect(await descriptor!.task).toBe("value");
    });

    it("should return null when no handler is registered", () => {
      const bus: CommandBus = new CommandBus();

      expect(bus.commandOptional("MISSING")).toBeNull();
    });

    it("should support async handlers", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("ASYNC", async () => "async-value");

      const descriptor = bus.commandOptional("ASYNC");

      expect(descriptor).not.toBeNull();
      expect(await descriptor!.task).toBe("async-value");
    });
  });
});
