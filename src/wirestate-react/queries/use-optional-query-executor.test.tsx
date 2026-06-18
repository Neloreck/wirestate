import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type Optional, type Nullable } from "../types/general";
import { type OptionalQueryExecutor } from "../types/queries";

import { useOptionalQueryExecutor } from "./use-optional-query-executor";

describe("useOptionalQueryExecutor", () => {
  it("should return an executor that dispatches queries", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptional");

    let executor: Nullable<OptionalQueryExecutor> = null as Nullable<OptionalQueryExecutor>;

    function TestComponent() {
      executor = useOptionalQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = (executor as OptionalQueryExecutor)("TEST_QUERY", "some-payload");

    expect(result).toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
    expect(bus.queryOptional).toHaveBeenCalledWith("TEST_QUERY", "some-payload");
  });

  it("should return undefined on unhandled queries", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    let executor: Nullable<OptionalQueryExecutor> = null as Nullable<OptionalQueryExecutor>;

    jest.spyOn(bus, "queryOptional");

    function TestComponent() {
      executor = useOptionalQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = (executor as OptionalQueryExecutor)("NOT_EXISTING", "payload");

    expect(result).toBeUndefined();
    expect(bus.queryOptional).toHaveBeenCalledWith("NOT_EXISTING", "payload");
  });

  it("should return promise values when the active handler returns a Promise", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (payload: string) => payload + "-async");

    let executor: Nullable<OptionalQueryExecutor> = null as Nullable<OptionalQueryExecutor>;

    function TestComponent() {
      executor = useOptionalQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<Promise<string>> = (executor as OptionalQueryExecutor)<Promise<string>, string>(
      "ASYNC_QUERY",
      "value"
    );

    await expect(result).resolves.toBe("value-async");
  });

  it("should return a stable executor between re-renders", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const executors: Array<OptionalQueryExecutor> = [];

    function TestComponent() {
      executors.push(useOptionalQueryExecutor());

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

    let executor: Nullable<OptionalQueryExecutor> = null as Nullable<OptionalQueryExecutor>;

    function TestComponent() {
      executor = useOptionalQueryExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect((executor as OptionalQueryExecutor)(type)).toBe("symbol-result");
  });
});
