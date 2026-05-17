import { render } from "@testing-library/react";
import { Container, Newable } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { ErrorLogBoundary } from "@/fixtures/react-components/error-log-boundary";
import { GenericService } from "@/fixtures/services/generic-service";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { useInjection } from "./use-injection";

describe("useInjection", () => {
  function TestComponent({ token = GenericService as Newable<object> }) {
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
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    const { getByTestId } = render(withContainerProvider(<TestComponent />, container));

    expect(getByTestId("injectable-name").textContent).toBe("GenericService");
  });

  it("should throw error when used outside of IocProvider", () => {
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
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === GenericService) {
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

    const container: Container = mockContainer({
      entries: [GenericService, AnotherService],
    });

    const { rerender, getByTestId } = render(
      withContainerProvider(<TestComponent token={GenericService} />, container)
    );

    expect(getByTestId("injectable-name").textContent).toBe("GenericService");

    rerender(withContainerProvider(<TestComponent token={AnotherService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("AnotherService");
  });
});
