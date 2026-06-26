/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type Optional, type Nullable } from "../types/general";
import { type QueryExecutorOptional } from "../types/queries";

import { useQueryExecutorOptional } from "./use-query-executor-optional";

describe("useQueryExecutorOptional", () => {
  it("should return an executor that dispatches queries", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptional");

    let executor: Nullable<QueryExecutorOptional> = null as Nullable<QueryExecutorOptional>;

    function TestComponent() {
      executor = useQueryExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = (executor as QueryExecutorOptional)("TEST_QUERY", "some-payload");

    expect(result).toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
    expect(bus.queryOptional).toHaveBeenCalledWith("TEST_QUERY", "some-payload");
  });

  it("should return undefined on unhandled queries", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    let executor: Nullable<QueryExecutorOptional> = null as Nullable<QueryExecutorOptional>;

    jest.spyOn(bus, "queryOptional");

    function TestComponent() {
      executor = useQueryExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = (executor as QueryExecutorOptional)("NOT_EXISTING", "payload");

    expect(result).toBeUndefined();
    expect(bus.queryOptional).toHaveBeenCalledWith("NOT_EXISTING", "payload");
  });

  it("should return promise values when the active handler returns a Promise", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (payload: string) => payload + "-async");

    let executor: Nullable<QueryExecutorOptional> = null as Nullable<QueryExecutorOptional>;

    function TestComponent() {
      executor = useQueryExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<Promise<string>> = (executor as QueryExecutorOptional)<Promise<string>, string>(
      "ASYNC_QUERY",
      "value"
    );

    await expect(result).resolves.toBe("value-async");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const executors: Array<QueryExecutorOptional> = [];

    function TestComponent() {
      executors.push(useQueryExecutorOptional());

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

  it("should support symbol query types", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("optional-query");

    bus.register(type, () => "symbol-result");

    let executor: Nullable<QueryExecutorOptional> = null as Nullable<QueryExecutorOptional>;

    function TestComponent() {
      executor = useQueryExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect((executor as QueryExecutorOptional)(type)).toBe("symbol-result");
  });
});
