import { render } from "@testing-library/react";
import { Container, createIocContainer, QueryBus } from "@wirestate/core";

import { useQueryHandler } from "@/wirestate-react/queries/use-query-handler";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { AnyObject, MaybePromise } from "@/wirestate-react/types/general";

describe("useQueryHandler", () => {
  it("should register and unregister a query handler", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    function TestComponent() {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    expect(bus.has("TEST_QUERY")).toBe(false);

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
    const bus: QueryBus = container.get(QueryBus);

    const handler1 = jest.fn(() => "result1");
    const handler2 = jest.fn(() => "result2");

    function TestComponent({ handler }: { handler: () => string }) {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    const { rerender } = render(withIocProvider(<TestComponent handler={handler1} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result1");

    rerender(withIocProvider(<TestComponent handler={handler2} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result2");
  });

  it("should re-register when query type changes", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn().mockReturnValue("value");

    function TestComponent({ type }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender } = render(withIocProvider(<TestComponent type={"QUERY_A"} />, container));

    expect(bus.has("QUERY_A")).toBe(true);
    expect(bus.has("QUERY_B")).toBe(false);

    rerender(withIocProvider(<TestComponent type={"QUERY_B"} />, container));

    expect(bus.has("QUERY_A")).toBe(false);
    expect(bus.has("QUERY_B")).toBe(true);
  });

  it("should call latest handler registered during render", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler1 = jest.fn().mockReturnValue("value1");
    const handler2 = jest.fn().mockReturnValue("value2");

    function TestComponent({ type, handler }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender, unmount } = render(
      withIocProvider(<TestComponent type={"QUERY"} handler={handler1} />, container)
    );

    expect(bus.has("QUERY")).toBe(true);
    expect(await bus.query("QUERY")).toBe("value1");

    rerender(withIocProvider(<TestComponent type={"QUERY"} handler={handler2} />, container));

    expect(bus.has("QUERY")).toBe(true);
    expect(await bus.query("QUERY")).toBe("value2");

    unmount();

    expect(bus.has("QUERY")).toBe(false);
  });

  it("should support async handlers", async () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn(async (data: string) => data + "-async");

    function TestComponent() {
      useQueryHandler("ASYNC_QUERY", handler);

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const result: string = await bus.query<string>("ASYNC_QUERY", "input");

    expect(result).toBe("input-async");
    expect(handler).toHaveBeenCalledWith("input");
  });
});
