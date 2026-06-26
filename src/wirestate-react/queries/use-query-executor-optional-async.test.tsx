/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type Optional, type Nullable } from "../types/general";
import { type QueryExecutorOptionalAsync } from "../types/queries";

import { useQueryExecutorOptionalAsync } from "./use-query-executor-optional-async";

describe("useQueryExecutorOptionalAsync", () => {
  it("should return an executor that dispatches sync queries as promises", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptionalAsync");

    let executor: Nullable<QueryExecutorOptionalAsync> = null as Nullable<QueryExecutorOptionalAsync>;

    function TestComponent() {
      executor = useQueryExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as QueryExecutorOptionalAsync)("TEST_QUERY", "some-payload");

    expect(result).toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("TEST_QUERY", "some-payload");
  });

  it("should resolve undefined on unhandled queries", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    let executor: Nullable<QueryExecutorOptionalAsync> = null as Nullable<QueryExecutorOptionalAsync>;

    jest.spyOn(bus, "queryOptionalAsync");

    function TestComponent() {
      executor = useQueryExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as QueryExecutorOptionalAsync)("NOT_EXISTING", "payload");

    expect(result).toBeUndefined();
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("NOT_EXISTING", "payload");
  });

  it("should resolve async handler results", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (payload: string) => payload + "-async");

    let executor: Nullable<QueryExecutorOptionalAsync> = null as Nullable<QueryExecutorOptionalAsync>;

    function TestComponent() {
      executor = useQueryExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as QueryExecutorOptionalAsync)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const executors: Array<QueryExecutorOptionalAsync> = [];

    function TestComponent() {
      executors.push(useQueryExecutorOptionalAsync());

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    rerender(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(executors).toHaveLength(2);
    expect(executors[0]).toBe(executors[1]);
  });

  it("should support symbol query types", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("optional-query");

    bus.register(type, () => "symbol-result");

    let executor: Nullable<QueryExecutorOptionalAsync> = null as Nullable<QueryExecutorOptionalAsync>;

    function TestComponent() {
      executor = useQueryExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect((executor as QueryExecutorOptionalAsync)(type)).resolves.toBe("symbol-result");
  });
});
