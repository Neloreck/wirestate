/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { Container, QueryBus } from "@wirestate/core";
import { useLayoutEffect } from "react";

import { ContainerProvider } from "../provision/container-provider";
import { type AnyObject } from "../types/general";

import { useQueryHandler } from "./use-query-handler";

describe("useQueryHandler", () => {
  it("should register and unregister a query handler", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    function TestComponent() {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    expect(bus.hasHandler("TEST_QUERY")).toBe(false);

    const { unmount } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(bus.hasHandler("TEST_QUERY")).toBe(true);

    const result: string = bus.query("TEST_QUERY", "payload");

    expect(result).toBe("payload-result");
    expect(handler).toHaveBeenCalledWith("payload");

    unmount();

    expect(bus.hasHandler("TEST_QUERY")).toBe(false);
  });

  it("should update handler ref when handler changes", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);

    const handler1 = jest.fn(() => "result1");
    const handler2 = jest.fn(() => "result2");

    function TestComponent({ handler }: { handler: () => string }) {
      useQueryHandler("TEST_QUERY", handler);

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent handler={handler1} />
      </ContainerProvider>
    );

    expect(bus.query("TEST_QUERY")).toBe("result1");

    rerender(
      <ContainerProvider container={container}>
        <TestComponent handler={handler2} />
      </ContainerProvider>
    );

    expect(bus.query("TEST_QUERY")).toBe("result2");
  });

  it("should re-register when query type changes", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn().mockReturnValue("value");

    function TestComponent({ type }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent type={"QUERY_A"} />
      </ContainerProvider>
    );

    expect(bus.hasHandler("QUERY_A")).toBe(true);
    expect(bus.hasHandler("QUERY_B")).toBe(false);

    rerender(
      <ContainerProvider container={container}>
        <TestComponent type={"QUERY_B"} />
      </ContainerProvider>
    );

    expect(bus.hasHandler("QUERY_A")).toBe(false);
    expect(bus.hasHandler("QUERY_B")).toBe(true);
  });

  it("should call latest handler registered during render", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler1 = jest.fn().mockReturnValue("value1");
    const handler2 = jest.fn().mockReturnValue("value2");

    function TestComponent({ type, handler }: AnyObject) {
      useQueryHandler(type, handler);

      return null;
    }

    const { rerender, unmount } = render(
      <ContainerProvider container={container}>
        <TestComponent type={"QUERY"} handler={handler1} />
      </ContainerProvider>
    );

    expect(bus.hasHandler("QUERY")).toBe(true);
    expect(bus.query("QUERY")).toBe("value1");

    rerender(
      <ContainerProvider container={container}>
        <TestComponent type={"QUERY"} handler={handler2} />
      </ContainerProvider>
    );

    expect(bus.hasHandler("QUERY")).toBe(true);
    expect(bus.query("QUERY")).toBe("value2");

    unmount();

    expect(bus.hasHandler("QUERY")).toBe(false);
  });

  it("should call latest handler when query is dispatched during rerender layout effects", () => {
    const container: Container = new Container({ bindings: [QueryBus] });
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

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent fire={false} handler={handler1} />
      </ContainerProvider>
    );

    expect(result).toBeUndefined();

    rerender(
      <ContainerProvider container={container}>
        <TestComponent fire={true} handler={handler2} />
      </ContainerProvider>
    );

    expect(result).toBe("result2");
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("should support async handlers", async () => {
    const container: Container = new Container({ bindings: [QueryBus] });
    const bus: QueryBus = container.get(QueryBus);
    const handler = jest.fn(async (payload: string) => payload + "-async");

    function TestComponent() {
      useQueryHandler("ASYNC_QUERY", handler);

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: string = await bus.queryAsync<string>("ASYNC_QUERY", "input");

    expect(result).toBe("input-async");
    expect(handler).toHaveBeenCalledWith("input");
  });
});
