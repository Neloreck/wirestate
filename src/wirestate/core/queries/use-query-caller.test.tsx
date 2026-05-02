import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { useQueryCaller } from "@/wirestate/core/queries/use-query-caller";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { Optional } from "@/wirestate/types/general";
import { TQueryCaller } from "@/wirestate/types/queries";

describe("useQueryCaller", () => {
  it("should return a caller that dispatches queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let caller: Optional<TQueryCaller> = null as Optional<TQueryCaller>;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = await (caller as TQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    jest.spyOn(bus, "query");

    let caller: Optional<TQueryCaller> = null;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as TQueryCaller)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should forward async handler results", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let caller: Optional<TQueryCaller> = null as Optional<TQueryCaller>;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = await (caller as TQueryCaller)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<TQueryCaller> = [];

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
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const type: unique symbol = Symbol("test-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<TQueryCaller> = null as Optional<TQueryCaller>;

    function TestComponent() {
      caller = useQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as TQueryCaller)(type)).toBe("symbol-result");
  });
});
