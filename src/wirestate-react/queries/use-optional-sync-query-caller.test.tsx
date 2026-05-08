import { render } from "@testing-library/react";
import { Container, createIocContainer, QueryBus } from "@wirestate/core";

import { withIocProvider } from "../test-utils/with-ioc-provider";
import { Optional } from "../types/general";
import { OptionalSyncQueryCaller } from "../types/queries";

import { useOptionalSyncQueryCaller } from "./use-optional-sync-query-caller";

describe("useOptionalSyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "queryOptional");

    let caller: Optional<OptionalSyncQueryCaller> = null as Optional<OptionalSyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = (caller as OptionalSyncQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.queryOptional).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should return null on unhandled queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    let caller: Optional<OptionalSyncQueryCaller> = null as Optional<OptionalSyncQueryCaller>;

    jest.spyOn(bus, "queryOptional");

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: Optional<string> = (caller as OptionalSyncQueryCaller)("NOT_EXISTING", "data");

    expect(result).toBeNull();
    expect(bus.queryOptional).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = createIocContainer();
    const callers: Array<OptionalSyncQueryCaller> = [];

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
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("optional-sync-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<OptionalSyncQueryCaller> = null as Optional<OptionalSyncQueryCaller>;

    function TestComponent() {
      caller = useOptionalSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect((caller as OptionalSyncQueryCaller)(type)).toBe("symbol-result");
  });
});
