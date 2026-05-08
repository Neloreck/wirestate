import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer, QueryBus, SyncQueryCaller } from "@/wirestate-core";
import { useSyncQueryCaller } from "@/wirestate-react/queries/use-sync-query-caller";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { Optional } from "@/wirestate-react/types/general";

describe("useSyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let caller: Optional<SyncQueryCaller> = null as Optional<SyncQueryCaller>;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = (caller as SyncQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "query");

    let caller: Optional<SyncQueryCaller> = null;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as SyncQueryCaller)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<SyncQueryCaller> = [];

    function TestComponent() {
      callers.push(useSyncQueryCaller());

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
    const type: unique symbol = Symbol("sync-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<SyncQueryCaller> = null as Optional<SyncQueryCaller>;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as SyncQueryCaller)(type)).toBe("symbol-result");
  });
});
