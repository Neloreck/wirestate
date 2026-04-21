import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { Optional } from "@/wirestate/types/general";
import { TQueryUnregister } from "@/wirestate/types/queries";

describe("QueryBus", () => {
  it("should register and dispatch a query handler", () => {
    const bus: QueryBus = new QueryBus();
    const handler = jest.fn().mockReturnValue("result");

    bus.register("TEST", handler);

    expect(bus.query("TEST", "data")).toBe("result");
    expect(handler).toHaveBeenCalledWith("data");
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

    const unregister: TQueryUnregister = bus.register("TYPE", () => "value");

    expect(bus.has("TYPE")).toBe(true);

    unregister();

    expect(bus.has("TYPE")).toBe(false);
  });

  it("should fall back to previous handler after unregistering top of stack", () => {
    const bus: QueryBus = new QueryBus();

    const unregisterFirst: TQueryUnregister = bus.register("TYPE", () => "first");
    const unregisterSecond: TQueryUnregister = bus.register("TYPE", () => "second");

    expect(bus.query("TYPE")).toBe("second");

    unregisterSecond();
    expect(bus.query("TYPE")).toBe("first");

    unregisterFirst();
    expect(() => bus.query("TYPE")).toThrow("No query handler registered in container for type: 'TYPE'.");
  });

  it("should handle async handlers", async () => {
    const bus: QueryBus = new QueryBus();

    bus.register("ASYNC", async (data: number) => data * 2);

    const result: number = await bus.query<number>("ASYNC", 5);

    expect(result).toBe(10);
  });

  it("should check if handler exists", () => {
    const bus: QueryBus = new QueryBus();

    expect(bus.has("TYPE")).toBe(false);

    bus.register("TYPE", () => null);

    expect(bus.has("TYPE")).toBe(true);
  });

  it("should clear all handlers", () => {
    const bus: QueryBus = new QueryBus();

    bus.register("A", () => null);
    bus.register("B", () => null);

    bus.clear();

    expect(bus.has("A")).toBe(false);
    expect(bus.has("B")).toBe(false);
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

    it("should return null when no handler is registered", () => {
      const bus: QueryBus = new QueryBus();

      expect(bus.queryOptional("MISSING")).toBeNull();
    });

    it("should support async handlers", async () => {
      const bus: QueryBus = new QueryBus();

      bus.register("ASYNC", async () => "async-value");

      const result: Optional<string> = await bus.queryOptional("ASYNC");

      expect(result).toBe("async-value");
    });
  });
});
