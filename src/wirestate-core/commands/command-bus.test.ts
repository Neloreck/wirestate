import { CommandUnregister } from "../types/commands";
import { Optional } from "../types/general";

import { CommandBus } from "./command-bus";

describe("CommandBus", () => {
  it("should register and dispatch a command handler synchronously", () => {
    const bus: CommandBus = new CommandBus();
    const handler = jest.fn().mockReturnValue("result");
    let wasExecuted: boolean = false;

    bus.register("TEST", (payload: string) => {
      wasExecuted = true;

      return handler(payload);
    });

    const result: string = bus.execute("TEST", "payload");

    expect(result).toBe("result");
    expect(wasExecuted).toBe(true);
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("should throw when no handler is registered", () => {
    const bus: CommandBus = new CommandBus();

    expect(() => bus.execute("MISSING")).toThrow("No command handler registered in container for type: 'MISSING'.");
  });

  it("should support handler shadowing (stack)", () => {
    const bus: CommandBus = new CommandBus();

    bus.register("TYPE", () => "first");
    bus.register("TYPE", () => "second");

    expect(bus.execute("TYPE")).toBe("second");
  });

  it("should unregister a handler", () => {
    const bus: CommandBus = new CommandBus();

    const unregister: CommandUnregister = bus.register("TYPE", () => "value");

    expect(bus.hasHandler("TYPE")).toBe(true);

    unregister();

    expect(bus.hasHandler("TYPE")).toBe(false);
  });

  it("should fall back to previous handler after unregistering top of stack", () => {
    const bus: CommandBus = new CommandBus();

    const unregisterFirst: CommandUnregister = bus.register("TYPE", () => "first");
    const unregisterSecond: CommandUnregister = bus.register("TYPE", () => "second");

    expect(bus.execute("TYPE")).toBe("second");

    unregisterSecond();
    expect(bus.execute("TYPE")).toBe("first");

    unregisterFirst();
    expect(() => bus.execute("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
  });

  it("should unregister only one duplicate handler registration per returned callback", () => {
    const bus: CommandBus = new CommandBus();
    const handler = jest.fn(() => "value");

    const unregisterFirst: CommandUnregister = bus.register("TYPE", handler);
    const unregisterSecond: CommandUnregister = bus.register("TYPE", handler);

    unregisterSecond();
    unregisterSecond();

    expect(bus.execute("TYPE")).toBe("value");

    unregisterFirst();

    expect(() => bus.execute("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
  });

  it("should return promise values from execute when the handler returns a Promise", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("ASYNC", async (payload: number) => payload * 2);

    const result: Promise<number> = bus.execute<Promise<number>, number>("ASYNC", 5);

    await expect(result).resolves.toBe(10);
  });

  it("should handle async handlers through executeAsync", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("ASYNC", async (payload: number) => payload * 2);

    const result: number = await bus.executeAsync<number>("ASYNC", 5);

    expect(result).toBe(10);
  });

  it("should wrap sync handler results through executeAsync", async () => {
    const bus: CommandBus = new CommandBus();

    bus.register("SYNC", (payload: number) => payload * 2);

    await expect(bus.executeAsync<number>("SYNC", 5)).resolves.toBe(10);
  });

  it("should reject through executeAsync when no handler is registered", async () => {
    const bus: CommandBus = new CommandBus();

    await expect(bus.executeAsync("MISSING")).rejects.toThrow(
      "No command handler registered in container for type: 'MISSING'."
    );
  });

  it("should throw synchronous handler errors from execute", () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("command failed");

    bus.register("FAIL", () => {
      throw error;
    });

    expect(() => bus.execute("FAIL")).toThrow("command failed");
  });

  it("should reject async handler errors through executeAsync", async () => {
    const bus: CommandBus = new CommandBus();
    const error = new Error("async failed");

    bus.register("FAIL_ASYNC", async () => {
      throw error;
    });

    await expect(bus.executeAsync("FAIL_ASYNC")).rejects.toThrow("async failed");
  });

  it("should check if handler exists", () => {
    const bus: CommandBus = new CommandBus();

    expect(bus.hasHandler("TYPE")).toBe(false);

    bus.register("TYPE", () => null);

    expect(bus.hasHandler("TYPE")).toBe(true);
  });

  it("should clear all handlers", () => {
    const bus: CommandBus = new CommandBus();

    bus.register("A", () => null);
    bus.register("B", () => null);

    bus.clear();

    expect(bus.hasHandler("A")).toBe(false);
    expect(bus.hasHandler("B")).toBe(false);
  });

  it("should handle unregistering when stack is already empty", () => {
    const bus: CommandBus = new CommandBus();
    const unregister: CommandUnregister = bus.register("TYPE", () => null);

    unregister();
    expect(() => unregister()).not.toThrow();
  });

  it("should support symbol command types", () => {
    const bus: CommandBus = new CommandBus();
    const type: unique symbol = Symbol("command");

    bus.register(type, () => "symbol-result");

    expect(bus.execute(type)).toBe("symbol-result");
  });

  describe("executeOptional", () => {
    it("should return a command result when handler exists", () => {
      const bus: CommandBus = new CommandBus();

      bus.register("TYPE", () => "value");

      expect(bus.executeOptional("TYPE")).toBe("value");
    });

    it("should return null when no handler is registered", () => {
      const bus: CommandBus = new CommandBus();

      expect(bus.executeOptional("MISSING")).toBeNull();
    });

    it("should return promise values from executeOptional when the handler returns a Promise", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("ASYNC", async () => "async-value");

      const result: Optional<Promise<string>> = bus.executeOptional<Promise<string>>("ASYNC");

      await expect(result).resolves.toBe("async-value");
    });

    it("should support async handlers through executeOptionalAsync", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("ASYNC", async () => "async-value");

      const result: Optional<string> = await bus.executeOptionalAsync("ASYNC");

      expect(result).toBe("async-value");
    });

    it("should wrap sync handler results through executeOptionalAsync", async () => {
      const bus: CommandBus = new CommandBus();

      bus.register("SYNC", () => "sync-value");

      await expect(bus.executeOptionalAsync("SYNC")).resolves.toBe("sync-value");
    });

    it("should resolve null through executeOptionalAsync when no handler is registered", async () => {
      const bus: CommandBus = new CommandBus();

      await expect(bus.executeOptionalAsync("MISSING")).resolves.toBeNull();
    });

    it("should support symbol command types", () => {
      const bus: CommandBus = new CommandBus();
      const type: unique symbol = Symbol("optional-command");

      bus.register(type, () => "symbol-result");

      expect(bus.executeOptional(type)).toBe("symbol-result");
    });

    it("should return null after unregistering last handler", () => {
      const bus: CommandBus = new CommandBus();

      const unregister: CommandUnregister = bus.register("TYPE", () => "value");

      expect(bus.executeOptional("TYPE")).toBe("value");

      unregister();

      expect(bus.executeOptional("TYPE")).toBeNull();
    });
  });

  describe("unregister", () => {
    it("should unregister a specific handler by type and reference", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      bus.register("TYPE", handler);
      bus.unregister("TYPE", handler);

      expect(bus.hasHandler("TYPE")).toBe(false);
      expect(() => bus.execute("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
    });

    it("should not throw when unregistering a handler not registered for the type", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn();

      expect(() => bus.unregister("MISSING", handler)).not.toThrow();
    });

    it("should not affect other handlers for the same type", () => {
      const bus: CommandBus = new CommandBus();
      const handlerA = jest.fn(() => "a");
      const handlerB = jest.fn(() => "b");

      bus.register("TYPE", handlerA);
      bus.register("TYPE", handlerB);
      bus.unregister("TYPE", handlerB);

      expect(bus.execute("TYPE")).toBe("a");
    });

    it("should not affect handlers for other types", () => {
      const bus: CommandBus = new CommandBus();
      const handlerA = jest.fn(() => "a");
      const handlerB = jest.fn(() => "b");

      bus.register("TYPE_A", handlerA);
      bus.register("TYPE_B", handlerB);
      bus.unregister("TYPE_A", handlerA);

      expect(bus.hasHandler("TYPE_A")).toBe(false);
      expect(bus.execute("TYPE_B")).toBe("b");
    });

    it("should not throw when unregistering a handler not present in the stack", () => {
      const bus: CommandBus = new CommandBus();
      const registered = jest.fn(() => "value");
      const unregistered = jest.fn();

      bus.register("TYPE", registered);

      expect(() => bus.unregister("TYPE", unregistered)).not.toThrow();
      expect(bus.execute("TYPE")).toBe("value");
    });

    it("should unregister only one duplicate handler registration by type and reference per call", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      bus.register("TYPE", handler);
      bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(bus.execute("TYPE")).toBe("value");

      bus.unregister("TYPE", handler);

      expect(() => bus.execute("TYPE")).toThrow("No command handler registered in container for type: 'TYPE'.");
    });

    it("should unregister the newest duplicate handler registration by type and reference", () => {
      const bus: CommandBus = new CommandBus();
      const handler = jest.fn(() => "value");

      const unregisterFirst: CommandUnregister = bus.register("TYPE", handler);
      const unregisterSecond: CommandUnregister = bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(bus.hasHandler("TYPE")).toBe(true);

      unregisterSecond();

      expect(bus.hasHandler("TYPE")).toBe(true);

      unregisterFirst();

      expect(bus.hasHandler("TYPE")).toBe(false);
    });
  });
});
