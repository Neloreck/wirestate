import { render } from "@testing-library/react";
import { Container, QueryBus, createContainer } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { Optional } from "../types/general";
import { OptionalAsyncQueryExecutor } from "../types/queries";

import { useOptionalAsyncQueryExecutor } from "./use-optional-async-query-executor";

describe("useOptionalAsyncQueryExecutor", () => {
  it("should return an executor that dispatches sync queries as promises", async () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptionalAsync");

    let executor: Optional<OptionalAsyncQueryExecutor> = null as Optional<OptionalAsyncQueryExecutor>;

    function TestComponent() {
      executor = useOptionalAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as OptionalAsyncQueryExecutor)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should resolve null on unhandled queries", async () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);
    let executor: Optional<OptionalAsyncQueryExecutor> = null as Optional<OptionalAsyncQueryExecutor>;

    jest.spyOn(bus, "queryOptionalAsync");

    function TestComponent() {
      executor = useOptionalAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as OptionalAsyncQueryExecutor)("NOT_EXISTING", "data");

    expect(result).toBeNull();
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should resolve async handler results", async () => {
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let executor: Optional<OptionalAsyncQueryExecutor> = null as Optional<OptionalAsyncQueryExecutor>;

    function TestComponent() {
      executor = useOptionalAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await (executor as OptionalAsyncQueryExecutor)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = createContainer();
    const executors: Array<OptionalAsyncQueryExecutor> = [];

    function TestComponent() {
      executors.push(useOptionalAsyncQueryExecutor());

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
    const container: Container = createContainer();
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("optional-query");

    bus.register(type, () => "symbol-result");

    let executor: Optional<OptionalAsyncQueryExecutor> = null as Optional<OptionalAsyncQueryExecutor>;

    function TestComponent() {
      executor = useOptionalAsyncQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect((executor as OptionalAsyncQueryExecutor)(type)).resolves.toBe("symbol-result");
  });
});
