import { Container } from "inversify";

import { QueryBus } from "@/wirestate/queries/query-bus";
import { queryOptional } from "@/wirestate/queries/query-optional";
import { QUERY_BUS_TOKEN } from "@/wirestate/registry";
import { mockContainer } from "@/wirestate/test-utils";

describe("queryOptional", () => {
  it("should return result when handler exists", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);

    bus.register("TYPE", () => "value");

    expect(queryOptional(container, "TYPE")).toBe("value");
  });

  it("should return null when no handler is registered", () => {
    const container: Container = mockContainer();

    expect(queryOptional(container, "MISSING")).toBeNull();
  });

  it("should pass data to handler", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);

    bus.register("CALC", (data: number) => data * 3);

    expect(queryOptional(container, "CALC", 7)).toBe(21);
  });
});
