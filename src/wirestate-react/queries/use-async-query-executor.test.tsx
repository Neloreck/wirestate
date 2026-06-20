/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type AsyncQueryExecutor } from "../types/queries";

import { useAsyncQueryExecutor } from "./use-async-query-executor";

describe("useAsyncQueryExecutor", () => {
  it("should return an executor that dispatches sync queries as promises", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryAsync");

    let executor: AsyncQueryExecutor = null as unknown as AsyncQueryExecutor;

    function TestComponent() {
      executor = useAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: string = await (executor as AsyncQueryExecutor)("TEST_QUERY", "some-payload");

    expect(result).toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
    expect(bus.queryAsync).toHaveBeenCalledWith("TEST_QUERY", "some-payload");
  });

  it("should forward async handler results", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (payload: string) => payload + "-async");

    let executor = null as unknown as AsyncQueryExecutor;

    function TestComponent() {
      executor = useAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: string = await (executor as AsyncQueryExecutor)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should reject on unhandled queries", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "queryAsync");

    let executor = null as unknown as AsyncQueryExecutor;

    function TestComponent() {
      executor = useAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect((executor as AsyncQueryExecutor)("NOT_EXISTING", "payload")).rejects.toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.queryAsync).toHaveBeenCalledWith("NOT_EXISTING", "payload");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const executors: Array<AsyncQueryExecutor> = [];

    function TestComponent() {
      executors.push(useAsyncQueryExecutor());

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
    const type: unique symbol = Symbol("test-query");

    bus.register(type, () => "symbol-result");

    let executor = null as unknown as AsyncQueryExecutor;

    function TestComponent() {
      executor = useAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect((executor as AsyncQueryExecutor)(type)).resolves.toBe("symbol-result");
  });
});
