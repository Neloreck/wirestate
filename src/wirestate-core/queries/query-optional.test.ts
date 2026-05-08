import { Container } from "inversify";

import { mockContainer } from "../test-utils/mock-container";

import { QueryBus } from "./query-bus";
import { queryOptional } from "./query-optional";

describe("queryOptional", () => {
  it("should return result when handler exists", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("TYPE", () => "value");

    expect(queryOptional(container, "TYPE")).toBe("value");
  });

  it("should return null when no handler is registered", () => {
    const container: Container = mockContainer();

    expect(queryOptional(container, "MISSING")).toBeNull();
  });

  it("should pass data to handler", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("CALC", (data: number) => data * 3);

    expect(queryOptional(container, "CALC", 7)).toBe(21);
  });
});
