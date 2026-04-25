import { render, cleanup } from "@testing-library/react";
import { Container, ServiceIdentifier } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { useOptionalInjection } from "@/wirestate/core/provision/use-optional-injection";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { Optional, TAnyObject } from "@/wirestate/types/general";

describe("useOptionalInjection", () => {
  function TestComponent({ token = GenericService as ServiceIdentifier<unknown> }) {
    const service: Optional<unknown> = useOptionalInjection(token);

    return (
      <div data-testid={"injectable-name"}>{service === null ? "null" : (service as TAnyObject).constructor.name}</div>
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
      services: [GenericService],
    });

    const { getByTestId } = render(withIocProvider(<TestComponent token={GenericService} />, container));

    expect(getByTestId("injectable-name").textContent).toBe(GenericService.name);
  });
});
