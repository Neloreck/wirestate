import { Container } from "inversify";

import { query } from "@/wirestate/core/container/query";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { mockContainer } from "@/wirestate/test-utils";

describe("query", () => {
  it("should call injected query bus methods with sync data", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);

    jest.spyOn(bus, "query").mockImplementation(() => "test-sync-response");

    const result = query(container, "SOME_SYNC_DATA", 1);

    expect(result).toBe("test-sync-response");
    expect(bus.query).toHaveBeenCalledTimes(1);
    expect(bus.query).toHaveBeenCalledWith("SOME_SYNC_DATA", 1);
  });

  it("should call injected query bus methods with async data", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);

    jest.spyOn(bus, "query").mockImplementation(async () => "test-async-response");

    const result = await query(container, "SOME_ASYNC_DATA", 100);

    expect(result).toBe("test-async-response");
    expect(bus.query).toHaveBeenCalledTimes(1);
    expect(bus.query).toHaveBeenCalledWith("SOME_ASYNC_DATA", 100);
  });

  it("should throw on not defined query handlers", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);

    jest.spyOn(bus, "query");

    expect(() => query(container, "SOME_UNKNOWN_DATA", 100)).toThrow(
      "No query handler registered in container for type: 'SOME_UNKNOWN_DATA'."
    );
  });
});
