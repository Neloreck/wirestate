import type { Optional } from "../../types/general";

import type { QueryUnregister } from "./queries";
import { QueryBus } from "./query-bus";

describe("QueryBus", () => {
  it("should register and dispatch a query handler", () => {
    const bus: QueryBus = new QueryBus();
    const handler = jest.fn().mockReturnValue("result");

    bus.register("TEST", handler);

    expect(bus.query("TEST", "payload")).toBe("result");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("should throw when no handler is registered", () => {
    const bus: QueryBus = new QueryBus();

    expect(() => bus.query("MISSING")).toThrow("No query handler registered in container for type: 'MISSING'.");
  });

  it("should support handler shadowing (stack)", () => {
    const bus: QueryBus = new QueryBus();

    bus.register("TYPE", () => "first");
    bus.register("TYPE", () => "second");

    expect(bus.query("TYPE")).toBe("second");
  });

  it("should unregister a handler", () => {
    const bus: QueryBus = new QueryBus();

    const unregister: QueryUnregister = bus.register("TYPE", () => "value");

    expect(bus.hasHandler("TYPE")).toBe(true);

    unregister();

    expect(bus.hasHandler("TYPE")).toBe(false);
  });

  it("should fall back to previous handler after unregistering top of stack", () => {
    const bus: QueryBus = new QueryBus();

    const unregisterFirst: QueryUnregister = bus.register("TYPE", () => "first");
    const unregisterSecond: QueryUnregister = bus.register("TYPE", () => "second");

    expect(bus.query("TYPE")).toBe("second");

    unregisterSecond();
    expect(bus.query("TYPE")).toBe("first");

    unregisterFirst();
    expect(() => bus.query("TYPE")).toThrow("No query handler registered in container for type: 'TYPE'.");
  });

  it("should unregister only one duplicate handler registration per returned callback", () => {
    const bus: QueryBus = new QueryBus();
    const handler = jest.fn(() => "value");

    const unregisterFirst: QueryUnregister = bus.register("TYPE", handler);
    const unregisterSecond: QueryUnregister = bus.register("TYPE", handler);

    unregisterSecond();
    unregisterSecond();

    expect(bus.query("TYPE")).toBe("value");

    unregisterFirst();

    expect(() => bus.query("TYPE")).toThrow("No query handler registered in container for type: 'TYPE'.");
  });

  it("should return promise values from query when the handler returns a Promise", async () => {
    const bus: QueryBus = new QueryBus();

    bus.register("ASYNC", async (payload: number) => payload * 2);

    const result: Promise<number> = bus.query<Promise<number>, number>("ASYNC", 5);

    await expect(result).resolves.toBe(10);
  });

  it("should handle async handlers through queryAsync", async () => {
    const bus: QueryBus = new QueryBus();

    bus.register("ASYNC", async (payload: number) => payload * 2);

    const result: number = await bus.queryAsync<number>("ASYNC", 5);

    expect(result).toBe(10);
  });

  it("should wrap sync handler results through queryAsync", async () => {
    const bus: QueryBus = new QueryBus();

    bus.register("SYNC", (payload: number) => payload * 2);

    await expect(bus.queryAsync<number>("SYNC", 5)).resolves.toBe(10);
  });

  it("should reject through queryAsync when no handler is registered", async () => {
    const bus: QueryBus = new QueryBus();

    await expect(bus.queryAsync("MISSING")).rejects.toThrow(
      "No query handler registered in container for type: 'MISSING'."
    );
  });

  it("should check if handler exists", () => {
    const bus: QueryBus = new QueryBus();

    expect(bus.hasHandler("TYPE")).toBe(false);

    bus.register("TYPE", () => null);

    expect(bus.hasHandler("TYPE")).toBe(true);
  });

  it("should clear all handlers", () => {
    const bus: QueryBus = new QueryBus();

    bus.register("A", () => null);
    bus.register("B", () => null);

    bus.clear();

    expect(bus.hasHandler("A")).toBe(false);
    expect(bus.hasHandler("B")).toBe(false);
  });

  it("should not throw when calling unregister after clear", () => {
    const bus: QueryBus = new QueryBus();
    const unregister: QueryUnregister = bus.register("TYPE", () => "value");

    bus.clear();

    expect(() => unregister()).not.toThrow();
    expect(bus.hasHandler("TYPE")).toBe(false);
  });

  it("should not throw when calling unregister twice while other handlers remain", () => {
    const bus: QueryBus = new QueryBus();

    bus.register("TYPE", () => "first");

    const unregister: QueryUnregister = bus.register("TYPE", () => "second");

    unregister();

    expect(() => unregister()).not.toThrow();
    expect(bus.query("TYPE")).toBe("first");
  });

  it("should support symbol query types", () => {
    const bus: QueryBus = new QueryBus();
    const type: unique symbol = Symbol("query");

    bus.register(type, () => "symbol-result");

    expect(bus.query(type)).toBe("symbol-result");
  });

  describe("queryOptional", () => {
    it("should return result when handler exists", () => {
      const bus: QueryBus = new QueryBus();

      bus.register("TYPE", () => "value");

      expect(bus.queryOptional("TYPE")).toBe("value");
    });

    it("should return undefined when no handler is registered", () => {
      const bus: QueryBus = new QueryBus();

      expect(bus.queryOptional("MISSING")).toBeUndefined();
    });

    it("should return promise values from queryOptional when the handler returns a Promise", async () => {
      const bus: QueryBus = new QueryBus();

      bus.register("ASYNC", async () => "async-value");

      const result: Optional<Promise<string>> = bus.queryOptional<Promise<string>>("ASYNC");

      await expect(result).resolves.toBe("async-value");
    });

    it("should support async handlers through queryOptionalAsync", async () => {
      const bus: QueryBus = new QueryBus();

      bus.register("ASYNC", async () => "async-value");

      const result: Optional<string> = await bus.queryOptionalAsync("ASYNC");

      expect(result).toBe("async-value");
    });

    it("should wrap sync handler results through queryOptionalAsync", async () => {
      const bus: QueryBus = new QueryBus();

      bus.register("SYNC", () => "sync-value");

      await expect(bus.queryOptionalAsync("SYNC")).resolves.toBe("sync-value");
    });

    it("should resolve undefined through queryOptionalAsync when no handler is registered", async () => {
      const bus: QueryBus = new QueryBus();

      await expect(bus.queryOptionalAsync("MISSING")).resolves.toBeUndefined();
    });

    it("should support symbol query types", () => {
      const bus: QueryBus = new QueryBus();
      const type: unique symbol = Symbol("optional-query");

      bus.register(type, () => "symbol-result");

      expect(bus.queryOptional(type)).toBe("symbol-result");
    });

    it("should return undefined after unregistering last handler", () => {
      const bus: QueryBus = new QueryBus();

      const unregister: QueryUnregister = bus.register("TYPE", () => "value");

      expect(bus.queryOptional("TYPE")).toBe("value");

      unregister();

      expect(bus.queryOptional("TYPE")).toBeUndefined();
    });
  });

  describe("unregister", () => {
    it("should unregister a specific handler by type and reference", () => {
      const bus: QueryBus = new QueryBus();
      const handler = jest.fn().mockReturnValue("value");

      bus.register("TYPE", handler);
      bus.unregister("TYPE", handler);

      expect(bus.hasHandler("TYPE")).toBe(false);
      expect(() => bus.query("TYPE")).toThrow("No query handler registered in container for type: 'TYPE'.");
    });

    it("should not throw when unregistering a handler not registered for the type", () => {
      const bus: QueryBus = new QueryBus();
      const handler = jest.fn();

      expect(() => bus.unregister("MISSING", handler)).not.toThrow();
    });

    it("should not affect other handlers for the same type", () => {
      const bus: QueryBus = new QueryBus();
      const handlerA = jest.fn().mockReturnValue("a");
      const handlerB = jest.fn().mockReturnValue("b");

      bus.register("TYPE", handlerA);
      bus.register("TYPE", handlerB);

      expect(bus.query("TYPE")).toBe("b");

      bus.unregister("TYPE", handlerB);

      expect(bus.query("TYPE")).toBe("a");
    });

    it("should not affect handlers for other types", () => {
      const bus: QueryBus = new QueryBus();
      const handlerA = jest.fn().mockReturnValue("a");
      const handlerB = jest.fn().mockReturnValue("b");

      bus.register("TYPE_A", handlerA);
      bus.register("TYPE_B", handlerB);
      bus.unregister("TYPE_A", handlerA);

      expect(bus.hasHandler("TYPE_A")).toBe(false);
      expect(bus.query("TYPE_B")).toBe("b");
    });

    it("should not throw when unregistering a handler not present in the stack", () => {
      const bus: QueryBus = new QueryBus();
      const registered = jest.fn(() => "value");
      const unregistered = jest.fn();

      bus.register("TYPE", registered);

      expect(() => bus.unregister("TYPE", unregistered)).not.toThrow();
      expect(bus.query("TYPE")).toBe("value");
    });

    it("should unregister only one duplicate handler registration by type and reference per call", () => {
      const bus: QueryBus = new QueryBus();
      const handler = jest.fn(() => "value");

      bus.register("TYPE", handler);
      bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(bus.query("TYPE")).toBe("value");

      bus.unregister("TYPE", handler);

      expect(() => bus.query("TYPE")).toThrow("No query handler registered in container for type: 'TYPE'.");
    });

    it("should unregister the newest duplicate handler registration by type and reference", () => {
      const bus: QueryBus = new QueryBus();
      const handler = jest.fn(() => "value");

      const unregisterFirst: QueryUnregister = bus.register("TYPE", handler);

      const unregisterSecond: QueryUnregister = bus.register("TYPE", handler);

      bus.unregister("TYPE", handler);

      expect(bus.hasHandler("TYPE")).toBe(true);

      unregisterSecond();

      expect(bus.hasHandler("TYPE")).toBe(true);

      unregisterFirst();

      expect(bus.hasHandler("TYPE")).toBe(false);
    });
  });
});
