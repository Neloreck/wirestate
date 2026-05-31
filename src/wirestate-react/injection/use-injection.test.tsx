import { render } from "@testing-library/react";
import { Container, Injectable, Newable, createContainer } from "@wirestate/core";

import { ErrorLogBoundary } from "@/fixtures/react-components/error-log-boundary";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useInjection } from "./use-injection";

describe("useInjection", () => {
  @Injectable()
  class SimpleService {}

  function TestComponent({ token = SimpleService as Newable<object> }) {
    const service = useInjection(token);

    return <div data-testid={"injectable-name"}>{service.constructor.name || String(service.constructor.name)}</div>;
  }

  it("should crash if service is not resolved", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByText } = render(
      withContainerProvider(
        <ErrorLogBoundary>
          <TestComponent />
        </ErrorLogBoundary>
      )
    );

    consoleSpy.mockRestore();

    expect(getByText(/No bindings found for service:/)).toBeTruthy();
  });

  it("should resolve bound service from container", () => {
    const container: Container = createContainer({ bindings: [SimpleService] });

    const { getByTestId } = render(withContainerProvider(<TestComponent />, container));

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

  it("should memoize service instance", () => {
    const container: Container = createContainer({ bindings: [SimpleService] });

    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === SimpleService) {
        resolveCount++;
      }

      return originalGet(token);
    });

    const { rerender } = render(withContainerProvider(<TestComponent />, container));

    expect(resolveCount).toBe(1);

    for (let i = 0; i < 10; i++) {
      rerender(withContainerProvider(<TestComponent />, container));
    }

    // Should NOT re-resolve because container and revision didn't change.
    expect(resolveCount).toBe(1);
  });

  it("should re-resolve when token changes", () => {
    class AnotherService {}

    const container: Container = createContainer({
      bindings: [SimpleService, AnotherService],
    });

    const { rerender, getByTestId } = render(withContainerProvider(<TestComponent token={SimpleService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("SimpleService");

    rerender(withContainerProvider(<TestComponent token={AnotherService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("AnotherService");
  });
});
