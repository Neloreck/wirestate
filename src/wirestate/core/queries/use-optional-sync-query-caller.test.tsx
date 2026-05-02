import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { useOptionalSyncQueryCaller } from "@/wirestate/core/queries/use-optional-sync-query-caller";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { Optional } from "@/wirestate/types/general";
import { TOptionalSyncQueryCaller } from "@/wirestate/types/queries";

describe("useOptionalSyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptional");

    let caller: Optional<TOptionalSyncQueryCaller> = null as Optional<TOptionalSyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = (caller as TOptionalSyncQueryCaller<string>)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryOptional).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should return null on unhandled queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    let caller: Optional<TOptionalSyncQueryCaller> = null as Optional<TOptionalSyncQueryCaller>;

    jest.spyOn(bus, "queryOptional");

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = (caller as TOptionalSyncQueryCaller<string>)("NOT_EXISTING", "data");

    expect(result).toBeNull();
    expect(bus.queryOptional).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<TOptionalSyncQueryCaller> = [];

    function TestComponent() {
      callers.push(useOptionalSyncQueryCaller());

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
    const type: unique symbol = Symbol("optional-sync-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<TOptionalSyncQueryCaller> = null as Optional<TOptionalSyncQueryCaller<string>>;

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as TOptionalSyncQueryCaller<string>)(type)).toBe("symbol-result");
  });
});
