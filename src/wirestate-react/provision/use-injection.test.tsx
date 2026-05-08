import { render, fireEvent, cleanup } from "@testing-library/react";
import { Container, Newable } from "inversify";

import { ErrorLogBoundary } from "@/fixtures/components/error-log-boundary";
import { GenericService } from "@/fixtures/services/generic-service";
import { useInjection } from "@/wirestate-react/provision/use-injection";
import { useIocContext } from "@/wirestate-react/provision/use-ioc-context";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("useInjection", () => {
  function TestComponent({ token = GenericService as Newable<object> }) {
    const service = useInjection(token);

    return <div data-testid={"injectable-name"}>{service.constructor.name || String(service.constructor.name)}</div>;
  }

  const TestComponentRevisionTrigger = () => {
    const { setRevision } = useIocContext();

    return (
      <button data-testid={"revision-increment"} onClick={() => setRevision((r) => r + 1)}>
        Increment revision
      </button>
    );
  };

  afterEach(cleanup);

  it("should crash if service is not resolved", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByText } = render(
      withIocProvider(
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

    const { getByTestId } = render(withIocProvider(<TestComponent />, container));

    expect(getByTestId("injectable-name").textContent).toBe("GenericService");
  });

  it("should re-resolve service when revision changes", () => {
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    const originalGet = container.get.bind(container);
    let resolveCount: number = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === GenericService) {
        resolveCount++;
      }

      return originalGet(token);
    });

    const { getByTestId } = render(
      withIocProvider(
        <ErrorLogBoundary>
          <TestComponent />
          <TestComponentRevisionTrigger />
        </ErrorLogBoundary>,
        container
      )
    );

    expect(resolveCount).toBe(1);

    fireEvent.click(getByTestId("revision-increment"));
    expect(resolveCount).toBe(2);

    fireEvent.click(getByTestId("revision-increment"));
    expect(resolveCount).toBe(3);
  });

  it("should throw error when used outside of IocProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { getByText } = render(
      <ErrorLogBoundary>
        <TestComponent />
      </ErrorLogBoundary>
    );

    consoleSpy.mockRestore();

    expect(getByText(/Trying to access IOC context/)).toBeTruthy();
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

    const { rerender } = render(withIocProvider(<TestComponent />, container));

    expect(resolveCount).toBe(1);

    for (let i = 0; i < 10; i++) {
      rerender(withIocProvider(<TestComponent />, container));
    }

    // Should NOT re-resolve because container and revision didn't change.
    expect(resolveCount).toBe(1);
  });

  it("should re-resolve when token changes", () => {
    class AnotherService {}

    const container: Container = mockContainer({
      entries: [GenericService, AnotherService],
    });

    const { rerender, getByTestId } = render(withIocProvider(<TestComponent token={GenericService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("GenericService");

    rerender(withIocProvider(<TestComponent token={AnotherService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("AnotherService");
  });
});
