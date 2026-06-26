/**
 * @jest-environment jsdom
 */

import { render, cleanup } from "@testing-library/react";
import { type ServiceToken, CommandsPlugin, Container, EventsPlugin, QueriesPlugin } from "@wirestate/core";

import { GenericService } from "@/fixtures/services/generic-service";

import { ContainerProvider } from "../provision/container-provider";
import { type AnyObject, type Nullable } from "../types/general";

import { useInjection } from "./use-injection";

describe("useInjection (optional)", () => {
  function TestComponent({ token = GenericService as ServiceToken<unknown> }) {
    const value: Nullable<unknown> = useInjection(token, { optional: true });

    return (
      <div data-testid={"injectable-name"}>
        {value === undefined ? "undefined" : (value as AnyObject).constructor.name}
      </div>
    );
  }

  afterEach(() => {
    cleanup();
  });

  it("should return undefined when token is not bound", () => {
    const container: Container = new Container();

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent token={Symbol("optional-token")} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe("undefined");
  });

  it("should resolve bound instance", () => {
    const container: Container = new Container({
      bindings: [GenericService],
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
    });

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent token={GenericService} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe(GenericService.name);
  });

  it("should use fallback when token is not bound", () => {
    const container: Container = new Container();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent() {
      const data: Nullable<string> = useInjection(token, { fallback: () => "fallback-value" });

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <FallbackComponent />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("fallback-value");
  });

  it("should type fallback values separately from injection values", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    function FallbackComponent() {
      const data: string | number = useInjection(token, { fallback: () => 10 });

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <FallbackComponent />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("10");
  });

  it("should provide container to fallback", () => {
    const container: Container = new Container();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind({ token: boundToken, value: "bound-value" });

    function FallbackComponent() {
      const data: Nullable<string> = useInjection(unboundToken, { fallback: (container) => container.get(boundToken) });

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <FallbackComponent />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("bound-value");
  });

  it("should not re-trigger resolving when fallback changes (depend only on container changes)", () => {
    const container: Container = new Container();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent({ value }: { value: string }) {
      const data: Nullable<string> = useInjection(token, { fallback: () => value });

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider container={container}>
        <FallbackComponent value={"first"} />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("first");

    rerender(
      <ContainerProvider container={container}>
        <FallbackComponent value={"second"} />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("first");
  });

  it("should not re-resolve bound token when fallback changes", () => {
    const container: Container = new Container();
    const token: unique symbol = Symbol("optional-token");
    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    container.bind({ token: token, value: "bound-value" });

    jest.spyOn(container, "get").mockImplementation((requestedToken) => {
      if (requestedToken === token) {
        resolveCount++;
      }

      return originalGet(requestedToken);
    });

    function FallbackComponent({ value }: { value: string }) {
      const data: Nullable<string> = useInjection(token, { fallback: () => value });

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId, rerender } = render(
      <ContainerProvider container={container}>
        <FallbackComponent value={"first"} />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("bound-value");
    expect(resolveCount).toBe(1);

    rerender(
      <ContainerProvider container={container}>
        <FallbackComponent value={"second"} />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("bound-value");
    expect(resolveCount).toBe(1);
  });

  it("should return a raw value fallback when the token is not bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    let captured: unknown;

    function RawComponent() {
      captured = useInjection(token, { fallback: "guest" });

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <RawComponent />
      </ContainerProvider>
    );

    expect(captured).toBe("guest");
  });

  it("should preserve falsy raw fallbacks instead of returning undefined", () => {
    const container: Container = new Container();

    const resolveFallback = (fallback: unknown): unknown => {
      let captured: unknown;

      function Probe(): null {
        captured = useInjection(Symbol("optional-token") as ServiceToken<unknown>, { fallback });

        return null;
      }

      const view = render(
        <ContainerProvider container={container}>
          <Probe />
        </ContainerProvider>
      );

      view.unmount();

      return captured;
    };

    expect(resolveFallback(0)).toBe(0);
    expect(resolveFallback("")).toBe("");
    expect(resolveFallback(false)).toBe(false);
    expect(resolveFallback(null)).toBeNull();
  });

  it("should treat a wrapped function as a fallback value", () => {
    const container: Container = new Container();
    const token: ServiceToken<() => string> = Symbol("optional-token");
    const fallbackFn = (): string => "fn-value";

    let captured: unknown;

    function RawComponent() {
      // A bare function is the factory; wrap it to fall back to a function value.
      captured = useInjection<() => string, () => string>(token, { fallback: () => fallbackFn });

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <RawComponent />
      </ContainerProvider>
    );

    expect(captured).toBe(fallbackFn);
  });

  it("should ignore the fallback when the token is bound", () => {
    const container: Container = new Container();
    const token: ServiceToken<string> = Symbol("optional-token");

    container.bind({ token, value: "bound-value" });

    let captured: unknown;

    function RawComponent() {
      captured = useInjection(token, { fallback: "raw-fallback" });

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <RawComponent />
      </ContainerProvider>
    );

    expect(captured).toBe("bound-value");
  });
});
