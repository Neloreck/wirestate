import { render, cleanup } from "@testing-library/react";
import { Container, ServiceIdentifier } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { GenericService } from "@/fixtures/services/generic-service";

import { withIocProvider } from "../test-utils/with-ioc-provider";
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

    const { getByTestId } = render(withIocProvider(<TestComponent token={Symbol("optional-token")} />, container));

    expect(getByTestId("injectable-name").textContent).toBe("null");
  });

  it("should resolve bound service", () => {
    const container: Container = mockContainer({
      entries: [GenericService],
    });

    const { getByTestId } = render(withIocProvider(<TestComponent token={GenericService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe(GenericService.name);
  });

  it("should use onFallback when token is not bound", () => {
    const container: Container = mockContainer();
    const token: unique symbol = Symbol("optional-token");

    function FallbackComponent() {
      const data: Optional<string> = useOptionalInjection(token, () => "fallback-value");

      return <div data-testid={"result"}>{data}</div>;
    }

    const { getByTestId } = render(withIocProvider(<FallbackComponent />, container));

    expect(getByTestId("result").textContent).toBe("fallback-value");
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

    const { getByTestId } = render(withIocProvider(<FallbackComponent />, container));

    expect(getByTestId("result").textContent).toBe("bound-value");
  });
});
