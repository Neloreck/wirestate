import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { AsyncQueryCaller } from "../types/queries";

import { useAsyncQueryCaller } from "./use-async-query-caller";

describe("useAsyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries as promises", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryAsync");

    let caller: AsyncQueryCaller = null as unknown as AsyncQueryCaller;

    function TestComponent() {
      caller = useAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = await (caller as AsyncQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryAsync).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should forward async handler results", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let caller = null as unknown as AsyncQueryCaller;

    function TestComponent() {
      caller = useAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = await (caller as AsyncQueryCaller)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should reject on unhandled queries", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "queryAsync");

    let caller = null as unknown as AsyncQueryCaller;

    function TestComponent() {
      caller = useAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    await expect((caller as AsyncQueryCaller)("NOT_EXISTING", "data")).rejects.toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.queryAsync).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = mockContainer();
    const callers: Array<AsyncQueryCaller> = [];

    function TestComponent() {
      callers.push(useAsyncQueryCaller());

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent />, container));

    rerender(withContainerProvider(<TestComponent />, container));

    expect(callers).toHaveLength(2);
    expect(callers[0]).toBe(callers[1]);
  });

  it("should support symbol query types", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("test-query");

    bus.register(type, () => "symbol-result");

    let caller = null as unknown as AsyncQueryCaller;

    function TestComponent() {
      caller = useAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    await expect((caller as AsyncQueryCaller)(type)).resolves.toBe("symbol-result");
  });
});
