import { render, cleanup } from "@testing-library/react";
import { Container, Identifier, createContainer } from "@wirestate/core";

import { GenericService } from "@/fixtures/services/generic-service";

import { ContainerProvider } from "../provision/container-provider";
import { AnyObject, Optional } from "../types/general";

import { useOptionalInjection } from "./use-optional-injection";

describe("useOptionalInjection", () => {
  function TestComponent({ token = GenericService as Identifier<unknown> }) {
    const value: Optional<unknown> = useOptionalInjection(token);

    return <div data-testid={"injectable-name"}>{value === null ? "null" : (value as AnyObject).constructor.name}</div>;
  }

  afterEach(() => {
    cleanup();
  });

  it("should return null when token is not bound", () => {
    const container: Container = createContainer();

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent token={Symbol("optional-token")} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe("null");
  });

  it("should resolve bound instance", () => {
    const container: Container = createContainer({
      bindings: [GenericService],
    });

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent token={GenericService} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe(GenericService.name);
  });

  it("should use fallback when token is not bound", () => {
    const container: Container = createContainer();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent() {
      const data: Optional<string> = useOptionalInjection(token, () => "fallback-value");

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
    const container: Container = createContainer();
    const token: Identifier<string> = Symbol("optional-token");

    function FallbackComponent() {
      const data: string | number = useOptionalInjection(token, () => 10);

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
    const container: Container = createContainer();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind({ provide: boundToken, useValue: "bound-value" });

    function FallbackComponent() {
      const data: Optional<string> = useOptionalInjection(unboundToken, (container) => container.get(boundToken));

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <FallbackComponent />
      </ContainerProvider>
    );

    expect(getByTestId("result").textContent).toBe("bound-value");
  });

  it("should not re-trigger resolving in fallback changes (depend only on container changes)", () => {
    const container: Container = createContainer();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent({ value }: { value: string }) {
      const data: Optional<string> = useOptionalInjection(token, () => value);

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
    const container: Container = createContainer();
    const token: unique symbol = Symbol("optional-token");
    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    container.bind({ provide: token, useValue: "bound-value" });

    jest.spyOn(container, "get").mockImplementation((requestedToken) => {
      if (requestedToken === token) {
        resolveCount++;
      }

      return originalGet(requestedToken);
    });

    function FallbackComponent({ value }: { value: string }) {
      const data: Optional<string> = useOptionalInjection(token, () => value);

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
});
