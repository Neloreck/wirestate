import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { useLayoutEffect } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { AnyObject } from "../types/general";

import { useQueryHandler } from "./use-query-handler";

describe("useQueryHandler", () => {
  it("should register and unregister a query handler", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((data: string) => data + "-result");

    function TestComponent() {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    expect(bus.has("TEST_QUERY")).toBe(false);

    const { unmount } = render(withContainerProvider(<TestComponent />, container));

    expect(bus.has("TEST_QUERY")).toBe(true);

    const result: string = bus.query("TEST_QUERY", "data");

    expect(result).toBe("data-result");
    expect(handler).toHaveBeenCalledWith("data");

    unmount();

    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should update handler ref when handler changes", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    const handler1 = jest.fn(() => "result1");
    const handler2 = jest.fn(() => "result2");

    function TestComponent({ handler }: { handler: () => string }) {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent handler={handler1} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result1");

    rerender(withContainerProvider(<TestComponent handler={handler2} />, container));

    expect(bus.query("TEST_QUERY")).toBe("result2");
  });

  it("should re-register when query type changes", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn().mockReturnValue("value");

    function TestComponent({ type }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent type={"QUERY_A"} />, container));

    expect(bus.has("QUERY_A")).toBe(true);
    expect(bus.has("QUERY_B")).toBe(false);

    rerender(withContainerProvider(<TestComponent type={"QUERY_B"} />, container));

    expect(bus.has("QUERY_A")).toBe(false);
    expect(bus.has("QUERY_B")).toBe(true);
  });

  it("should call latest handler registered during render", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler1 = jest.fn().mockReturnValue("value1");
    const handler2 = jest.fn().mockReturnValue("value2");

    function TestComponent({ type, handler }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender, unmount } = render(
      withContainerProvider(<TestComponent type={"QUERY"} handler={handler1} />, container)
    );

    expect(bus.has("QUERY")).toBe(true);
    expect(bus.query("QUERY")).toBe("value1");

    rerender(withContainerProvider(<TestComponent type={"QUERY"} handler={handler2} />, container));

    expect(bus.has("QUERY")).toBe(true);
    expect(bus.query("QUERY")).toBe("value2");

    unmount();

    expect(bus.has("QUERY")).toBe(false);
  });

  it("should call latest handler when query is dispatched during rerender layout effects", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);

    let result: unknown;

    const handler1 = jest.fn(() => "result1");
    const handler2 = jest.fn(() => "result2");

    function TestComponent({ fire, handler }: { fire: boolean; handler: () => string }) {
      useQueryHandler("IMMEDIATE_QUERY", handler);

      useLayoutEffect(() => {
        if (fire) {
          result = bus.query("IMMEDIATE_QUERY");
        }
      }, [fire]);

      return null;
    }

    const { rerender } = render(withContainerProvider(<TestComponent fire={false} handler={handler1} />, container));

    expect(result).toBeUndefined();

    rerender(withContainerProvider(<TestComponent fire={true} handler={handler2} />, container));

    expect(result).toBe("result2");
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("should support async handlers", async () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn(async (data: string) => data + "-async");

    function TestComponent() {
      useQueryHandler("ASYNC_QUERY", handler);

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = await bus.queryAsync<string>("ASYNC_QUERY", "input");

    expect(result).toBe("input-async");
    expect(handler).toHaveBeenCalledWith("input");
  });
});
