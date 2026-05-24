import { render, cleanup } from "@testing-library/react";
import { Container, ServiceIdentifier } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { GenericService } from "@/fixtures/services/generic-service";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { AnyObject, Optional } from "../types/general";

import { useOptionalInjection } from "./use-optional-injection";

describe("useOptionalInjection", () => {
  function TestComponent({ token = GenericService as ServiceIdentifier<unknown> }) {
    const service: Optional<unknown> = useOptionalInjection(token);

    return (
      <div data-testid={"injectable-name"}>{service === null ? "null" : (service as AnyObject).constructor.name}</div>
    );
  }

  afterEach(() => {
    cleanup();
  });

  it("should return null when token is not bound", () => {
    const container: Container = mockContainer();

    const { getByTestId } = render(
      withContainerProvider(<TestComponent token={Symbol("optional-token")} />, container)
    );

    expect(getByTestId("injectable-name").textContent).toBe("null");
  });

  it("should resolve bound service", () => {
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    const { getByTestId } = render(withContainerProvider(<TestComponent token={GenericService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe(GenericService.name);
  });

  it("should use onFallback when token is not bound", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent() {
      const data: Optional<string> = useOptionalInjection(token, () => "fallback-value");

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(withContainerProvider(<FallbackComponent />, container));

    expect(getByTestId("result").textContent).toBe("fallback-value");
  });

  it("should type fallback values separately from injection values", () => {
    const container: Container = mockContainer();
    const token: ServiceIdentifier<string> = Symbol("optional-token");

    function FallbackComponent() {
      const data: string | number = useOptionalInjection(token, () => 10);

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(withContainerProvider(<FallbackComponent />, container));

    expect(getByTestId("result").textContent).toBe("10");
  });

  it("should provide container to onFallback", () => {
    const container: Container = mockContainer();
    const unboundToken: unique symbol = Symbol("unbound-token");
    const boundToken: unique symbol = Symbol("bound-token");

    container.bind(boundToken).toConstantValue("bound-value");

    function FallbackComponent() {
      const data: Optional<string> = useOptionalInjection(unboundToken, (container) => container.get(boundToken));

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(withContainerProvider(<FallbackComponent />, container));

    expect(getByTestId("result").textContent).toBe("bound-value");
  });

  it("should not re-trigger resolving in fallback changes (depend only on container changes)", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent({ value }: { value: string }) {
      const data: Optional<string> = useOptionalInjection(token, () => value);

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId, rerender } = render(withContainerProvider(<FallbackComponent value={"first"} />, container));

    expect(getByTestId("result").textContent).toBe("first");

    rerender(withContainerProvider(<FallbackComponent value={"second"} />, container));

    expect(getByTestId("result").textContent).toBe("first");
  });

  it("should not re-resolve bound token when onFallback changes", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");
    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    container.bind(token).toConstantValue("bound-value");

    jest.spyOn(container, "get").mockImplementation((injectionId) => {
      if (injectionId === token) {
        resolveCount++;
      }

      return originalGet(injectionId);
    });

    function FallbackComponent({ value }: { value: string }) {
      const data: Optional<string> = useOptionalInjection(token, () => value);

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId, rerender } = render(withContainerProvider(<FallbackComponent value={"first"} />, container));

    expect(getByTestId("result").textContent).toBe("bound-value");
    expect(resolveCount).toBe(1);

    rerender(withContainerProvider(<FallbackComponent value={"second"} />, container));

    expect(getByTestId("result").textContent).toBe("bound-value");
    expect(resolveCount).toBe(1);
  });
});
