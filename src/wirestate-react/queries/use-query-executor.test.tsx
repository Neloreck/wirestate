import { render } from "@testing-library/react";
import { Container, QueryBus, createContainer } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { QueryExecutor } from "../types/queries";

import { useQueryExecutor } from "./use-query-executor";

describe("useQueryExecutor", () => {
  it("should return an executor that dispatches queries", () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let executor: QueryExecutor = null as unknown as QueryExecutor;

    function TestComponent() {
      executor = useQueryExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = (executor as QueryExecutor)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "query");

    let executor = null as unknown as QueryExecutor;

    function TestComponent() {
      executor = useQueryExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(() => (executor as QueryExecutor)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return promise values when the active handler returns a Promise", async () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let executor = null as unknown as QueryExecutor;

    function TestComponent() {
      executor = useQueryExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: Promise<string> = (executor as QueryExecutor)<Promise<string>, string>("ASYNC_QUERY", "value");

    await expect(result).resolves.toBe("value-async");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = createContainer();
    const executors: Array<QueryExecutor> = [];

    function TestComponent() {
      executors.push(useQueryExecutor());

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent />, container));

    rerender(withContainerProvider(<TestComponent />, container));

    expect(executors).toHaveLength(2);
    expect(executors[0]).toBe(executors[1]);
  });

  it("should support symbol query types", () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("test-query");

    bus.register(type, () => "symbol-result");

    let executor = null as unknown as QueryExecutor;

    function TestComponent() {
      executor = useQueryExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect((executor as QueryExecutor)(type)).toBe("symbol-result");
  });
});
