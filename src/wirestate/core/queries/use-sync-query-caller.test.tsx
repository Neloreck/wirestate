import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { useSyncQueryCaller } from "@/wirestate/core/queries/use-sync-query-caller";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { Optional } from "@/wirestate/types/general";

describe("useSyncQueryCaller", () => {
  it("should return a caller that dispatches sync queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_QUERY", handler);

    jest.spyOn(bus, "query");

    let caller: Optional<ReturnType<typeof useSyncQueryCaller>> = null;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = (caller as any)("TEST_QUERY", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", "some-data");
  });

  it("should throw on unhandled queries", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    jest.spyOn(bus, "query");

    let caller: Optional<ReturnType<typeof useSyncQueryCaller>> = null;

    function TestComponent() {
      caller = useSyncQueryCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as any)("NOT_EXISTING", "data")).toThrow(
      "No query handler registered in container for type: 'NOT_EXISTING'."
    );
    expect(bus.query).toHaveBeenCalledWith("NOT_EXISTING", "data");
  });
});
