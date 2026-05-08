import { render } from "@testing-library/react";
import { Container, createIocContainer, QueryBus } from "@wirestate/core";

import { useQueryCaller } from "@/wirestate-react/queries/use-query-caller";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { QueryCaller } from "@/wirestate-react/types/queries";

describe("useQueryCaller", () => {
  it("should return a caller that dispatches queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let caller: QueryCaller = null as unknown as QueryCaller;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = await (caller as QueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "query");

    let caller = null as unknown as QueryCaller;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as QueryCaller)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should forward async handler results", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let caller = null as unknown as QueryCaller;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = await (caller as QueryCaller)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<QueryCaller> = [];

    function TestComponent() {
      callers.push(useQueryCaller());

      return null;
    }

    const { rerender } = render(withIocProvider(<TestComponent />, container));

    rerender(withIocProvider(<TestComponent />, container));

    expect(callers).toHaveLength(2);
    expect(callers[0]).toBe(callers[1]);
  });

  it("should support symbol query types", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("test-query");

    bus.register(type, () => "symbol-result");

    let caller = null as unknown as QueryCaller;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as QueryCaller)(type)).toBe("symbol-result");
  });
});
