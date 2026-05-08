import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { useOptionalQueryCaller } from "@/wirestate-react/queries/use-optional-query-caller";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { MaybePromise, Optional } from "@/wirestate/types/general";
import { TOptionalQueryCaller } from "@/wirestate/types/queries";

describe("useOptionalQueryCaller", () => {
  it("should return a caller that dispatches queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptional");

    let caller: Optional<TOptionalQueryCaller> = null as Optional<TOptionalQueryCaller>;

    function TestComponent() {
      caller = useOptionalQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = await (caller as TOptionalQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryOptional).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should return null on unhandled queries", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    let caller: Optional<TOptionalQueryCaller> = null as Optional<TOptionalQueryCaller>;

    jest.spyOn(bus, "queryOptional");

    function TestComponent() {
      caller = useOptionalQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<MaybePromise<string>> = (caller as TOptionalQueryCaller)("NOT_EXISTING", "data");

    expect(result).toBeNull();
    expect(bus.queryOptional).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should resolve async handler results", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    bus.register("ASYNC_QUERY", async (data: string) => data + "-async");

    let caller: Optional<TOptionalQueryCaller> = null as Optional<TOptionalQueryCaller>;

    function TestComponent() {
      caller = useOptionalQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = await (caller as TOptionalQueryCaller)("ASYNC_QUERY", "value");

    expect(result).toBe("value-async");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<TOptionalQueryCaller> = [];

    function TestComponent() {
      callers.push(useOptionalQueryCaller());

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
    const type: unique symbol = Symbol("optional-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<TOptionalQueryCaller> = null as Optional<TOptionalQueryCaller>;

    function TestComponent() {
      caller = useOptionalQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as TOptionalQueryCaller)(type)).toBe("symbol-result");
  });
});
