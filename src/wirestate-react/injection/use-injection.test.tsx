import { render } from "@testing-library/react";
import { Container, Injectable, Newable } from "@wirestate/core";

import { ErrorLogBoundary } from "@/fixtures/react-components/error-log-boundary";

import { ContainerProvider } from "../provision/container-provider";

import { useInjection } from "./use-injection";

describe("useInjection", () => {
  @Injectable()
  class SimpleService {}

  function TestComponent({ token = SimpleService as Newable<object> }) {
    const service = useInjection(token);

    return <div data-testid={"injectable-name"}>{service.constructor.name || String(service.constructor.name)}</div>;
  }

  it("should crash if value is not resolved", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByText } = render(
      <ContainerProvider container={new Container()}>
        <ErrorLogBoundary>
          <TestComponent />
        </ErrorLogBoundary>
      </ContainerProvider>
    );

    consoleSpy.mockRestore();

    expect(getByText("No binding(s) found for 'SimpleService'", { exact: false })).toBeTruthy();
  });

  it("should resolve bound instance from container", () => {
    const container: Container = new Container({ bindings: [SimpleService] });

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe("SimpleService");
  });

  it("should throw error when used outside of ContainerProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByText } = render(
      <ErrorLogBoundary>
        <TestComponent />
      </ErrorLogBoundary>
    );

    consoleSpy.mockRestore();

    expect(
      getByText(/Trying to access container context from React subtree not wrapped in <ContainerProvider>./)
    ).toBeTruthy();
  });

  it("should memoize instance", () => {
    const container: Container = new Container({ bindings: [SimpleService] });

    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === SimpleService) {
        resolveCount++;
      }

      return originalGet(token);
    });

    const { rerender } = render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(resolveCount).toBe(1);

    for (let i = 0; i < 10; i++) {
      rerender(
        <ContainerProvider container={container}>
          <TestComponent />
        </ContainerProvider>
      );
    }

    // Should NOT re-resolve because container and revision didn't change.
    expect(resolveCount).toBe(1);
  });

  it("should re-resolve when token changes", () => {
    @Injectable()
    class AnotherService {}

    const container: Container = new Container({
      bindings: [SimpleService, AnotherService],
    });

    const { rerender, getByTestId } = render(
      <ContainerProvider container={container}>
        <TestComponent token={SimpleService} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe("SimpleService");

    rerender(
      <ContainerProvider container={container}>
        <TestComponent token={AnotherService} />
      </ContainerProvider>
    );

    expect(getByTestId("injectable-name").textContent).toBe("AnotherService");
  });
});
