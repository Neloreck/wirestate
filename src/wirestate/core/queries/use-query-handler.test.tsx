import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { useQueryHandler } from "@/wirestate/core/queries/use-query-handler";
import { QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { Callable, MaybePromise } from "@/wirestate/types/general";

describe("useQueryHandler", () => {
  it("should register and unregister a query handler", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);
    const handler = jest.fn((data: string) => data + "-result");

    function TestComponent() {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    const { unmount } = render(withIocProvider(<TestComponent />, container));

    expect(bus.has("TEST_QUERY")).toBe(true);

    const result: MaybePromise<string> = bus.query("TEST_QUERY", "data");

    expect(result).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should update handler ref when handler changes", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    const handler1 = jest.fn(() => "result1");
    const handler2 = jest.fn(() => "result2");

    function TestComponent({ handler }: { handler: Callable<string> }) {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    const { rerender } = render(withIocProvider(<TestComponent handler={handler1} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result1");

    rerender(withIocProvider(<TestComponent handler={handler2} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result2");
  });
});
