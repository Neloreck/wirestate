import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { Optional } from "../types/general";
import { OptionalAsyncQueryCaller } from "../types/queries";

import { useOptionalAsyncQueryCaller } from "./use-optional-async-query-caller";

describe("useOptionalAsyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries as promises", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptionalAsync");

    let caller: Optional<OptionalAsyncQueryCaller> = null as Optional<OptionalAsyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: Optional<string> = await (caller as OptionalAsyncQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should resolve null on unhandled queries", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    let caller: Optional<OptionalAsyncQueryCaller> = null as Optional<OptionalAsyncQueryCaller>;

    jest.spyOn(bus, "queryOptionalAsync");

    function TestComponent() {
      caller = useOptionalAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: Optional<string> = await (caller as OptionalAsyncQueryCaller)("NOT_EXISTING", "data");

    expect(result).toBeNull();
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should resolve async handler results", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let caller: Optional<OptionalAsyncQueryCaller> = null as Optional<OptionalAsyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: Optional<string> = await (caller as OptionalAsyncQueryCaller)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = mockContainer();
    const callers: Array<OptionalAsyncQueryCaller> = [];

    function TestComponent() {
      callers.push(useOptionalAsyncQueryCaller());

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
    const type: unique symbol = Symbol("optional-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<OptionalAsyncQueryCaller> = null as Optional<OptionalAsyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalAsyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    await expect((caller as OptionalAsyncQueryCaller)(type)).resolves.toBe("symbol-result");
  });
});
