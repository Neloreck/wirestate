import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { Optional } from "../types/general";
import { SyncQueryCaller } from "../types/queries";

import { useSyncQueryCaller } from "./use-sync-query-caller";

describe("useSyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let caller: Optional<SyncQueryCaller> = null as Optional<SyncQueryCaller>;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = (caller as SyncQueryCaller)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    jest.spyOn(bus, "query");

    let caller: Optional<SyncQueryCaller> = null;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(() => (caller as SyncQueryCaller)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });

  it("should return a stable caller between re-renders", () => {
    const container: Container = mockContainer();
    const callers: Array<SyncQueryCaller> = [];

    function TestComponent() {
      callers.push(useSyncQueryCaller());

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent />, container));

    rerender(withContainerProvider(<TestComponent />, container));

    expect(callers).toHaveLength(2);
    expect(callers[0]).toBe(callers[1]);
  });

  it("should support symbol query types", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const type: unique symbol = Symbol("sync-query");

    bus.register(type, () => "symbol-result");

    let caller: Optional<SyncQueryCaller> = null as Optional<SyncQueryCaller>;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect((caller as SyncQueryCaller)(type)).toBe("symbol-result");
  });
});
