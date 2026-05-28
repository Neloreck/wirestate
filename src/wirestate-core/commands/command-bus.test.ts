import { CommandStatus, Command, CommandUnregister } from "../types/commands";

import { CommandBus } from "./command-bus";

describe("CommandBus", () => {
  it("should register and dispatch a command handler", async () => {
    const bus: CommandBus = new CommandBus();
    const handler = jest.fn().mockReturnValue("result");

    bus.register("TEST", handler);

    const command: Command<string> = bus.command("TEST", "data");

    expect(command.status).toBe(CommandStatus.PENDING);

    const result: string = await command.task;

    expect(result).toBe("result");
    expect(handler).toHaveBeenCalledWith("data");
    expect(command.status).toBe(CommandStatus.SUCCESS);
  });

  it("should throw when no handler is registered", () => {
    const bus: CommandBus = new CommandBus();

    expect(() => bus.command("MISSING")).toThrow("No command handler registered in container for type: 'MISSING'.");
  });

  it("should support handler shadowing (stack)", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("TYPE", () => "first");
    bus.register("TYPE", () => "second");

    const command: Command<string> = bus.command("TYPE");

    expect(await command.task).toBe("second");
  });

  it("should unregister a handler", () => {
    const bus: CommandBus = new CommandBus();

    const unregister: CommandUnregister = bus.register("TYPE", () => "value");

    expect(bus.has("TYPE")).toBe(true);

    unregister();

    expect(bus.has("TYPE")).toBe(false);
  });

  it("should fall back to previous handler after unregistering top of stack", async () => {
    const bus: CommandBus = new CommandBus();

    const unregisterFirst: CommandUnregister = bus.register("TYPE", () => "first");
    const unregisterSecond: CommandUnregister = bus.register("TYPE", () => "second");

    expect(await bus.command("TYPE").task).toBe("second");

    unregisterSecond();
    expect(await bus.command("TYPE").task).toBe("first");

    unregisterFirst();
    expect(() => bus.command("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
  });

  it("should unregister only one duplicate handler registration per returned callback", async () => {
    const bus: CommandBus = new CommandBus();
    const handler = jest.fn(() => "value");

    const unregisterFirst: CommandUnregister = bus.register("TYPE", handler);
    const unregisterSecond: CommandUnregister = bus.register("TYPE", handler);

    unregisterSecond();
    unregisterSecond();

    expect(await bus.command("TYPE").task).toBe("value");

    unregisterFirst();

    expect(() => bus.command("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
  });

  it("should handle async handlers", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("ASYNC", async (data: number) => data * 2);

    const command: Command<number> = bus.command<number>("ASYNC", 5);

    expect(command.status).toBe(CommandStatus.PENDING);

    const result: number = await command.task;

    expect(result).toBe(10);
    expect(command.status).toBe(CommandStatus.SUCCESS);
  });

  it("should set error status on handler rejection", async () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("command failed");

    bus.register("FAIL", () => {
      throw error;
    });

    const command: Command = bus.command("FAIL");

    expect(command.status).toBe(CommandStatus.PENDING);

    await expect(command.task).rejects.toThrow("command failed");

    expect(command.status).toBe(CommandStatus.ERROR);
  });

  it("should set error status on async handler rejection", async () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("async failed");

    bus.register("FAIL_ASYNC", async () => {
      throw error;
    });

    const command: Command = bus.command("FAIL_ASYNC");

    await expect(command.task).rejects.toThrow("async failed");

    expect(command.status).toBe(CommandStatus.ERROR);
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

  it("should handle unregistering when stack is already empty", () => {
    const bus: CommandBus = new CommandBus();
    const unregister: CommandUnregister = bus.register("TYPE", () => null);

    unregister();
    expect(() => unregister()).not.toThrow();
  });

  it("should support symbol command types", async () => {
    const bus: CommandBus = new CommandBus();
    const type: unique symbol = Symbol("command");

    bus.register(type, () => "symbol-result");

    const command: Command<string> = bus.command(type);

    expect(await command.task).toBe("symbol-result");
  });

  describe("commandOptional", () => {
    it("should return a command when handler exists", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("TYPE", () => "value");

      const command = bus.commandOptional("TYPE");

      expect(command).not.toBeNull();
      expect(await command!.task).toBe("value");
    });

    it("should return null when no handler is registered", () => {
      const bus: CommandBus = new CommandBus();

      expect(bus.commandOptional("MISSING")).toBeNull();
    });

    it("should support async handlers", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("ASYNC", async () => "async-value");

      const command = bus.commandOptional("ASYNC");

      expect(command).not.toBeNull();
      expect(await command!.task).toBe("async-value");
    });
  });

  describe("unregister", () => {
    it("should unregister a specific handler by type and reference", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      bus.register("TYPE", handler);
      bus.unregister("TYPE", handler);

      expect(bus.has("TYPE")).toBe(false);
      expect(() => bus.command("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
    });

    it("should not throw when unregistering a handler not registered for the type", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn();

      expect(() => bus.unregister("MISSING", handler)).not.toThrow();
    });

    it("should not affect other handlers for the same type", async () => {
      const bus: CommandBus = new CommandBus();
      const handlerA = jest.fn(() => "a");
      const handlerB = jest.fn(() => "b");

      bus.register("TYPE", handlerA);
      bus.register("TYPE", handlerB);
      bus.unregister("TYPE", handlerB);

      expect(await bus.command("TYPE").task).toBe("a");
    });

    it("should not affect handlers for other types", async () => {
      const bus: CommandBus = new CommandBus();
      const handlerA = jest.fn(() => "a");
      const handlerB = jest.fn(() => "b");

      bus.register("TYPE_A", handlerA);
      bus.register("TYPE_B", handlerB);
      bus.unregister("TYPE_A", handlerA);

      expect(bus.has("TYPE_A")).toBe(false);
      expect(await bus.command("TYPE_B").task).toBe("b");
    });

    it("should not throw when unregistering a handler not present in the stack", async () => {
      const bus: CommandBus = new CommandBus();
      const registered = jest.fn(() => "value");
      const unregistered = jest.fn();

      bus.register("TYPE", registered);

      expect(() => bus.unregister("TYPE", unregistered)).not.toThrow();
      expect(await bus.command("TYPE").task).toBe("value");
    });

    it("should unregister only one duplicate handler registration by type and reference per call", async () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      bus.register("TYPE", handler);
      bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(await bus.command("TYPE").task).toBe("value");

      bus.unregister("TYPE", handler);

      expect(() => bus.command("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
    });

    it("should unregister the newest duplicate handler registration by type and reference", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      const unregisterFirst: CommandUnregister = bus.register("TYPE", handler);
      const unregisterSecond: CommandUnregister = bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(bus.has("TYPE")).toBe(true);

      unregisterSecond();

      expect(bus.has("TYPE")).toBe(true);

      unregisterFirst();

      expect(bus.has("TYPE")).toBe(false);
    });
  });
});
