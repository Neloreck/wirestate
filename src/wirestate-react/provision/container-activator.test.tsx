import { render } from "@testing-library/react";
import { Container, Injectable } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { StrictMode } from "react";

import { withContainerProvider } from "../test-utils/with-container-provider";

import { ContainerActivator } from "./container-activator";

describe("ContainerActivator", () => {
  @Injectable()
  class ServiceA {}

  @Injectable()
  class ServiceB {}

  function getServiceCallsCount(getSpy: jest.SpyInstance, serviceIdentifier: unknown): number {
    return getSpy.mock.calls.filter(([entry]) => entry === serviceIdentifier).length;
  }

  it("should render children", () => {
    const { getByText } = render(
      withContainerProvider(
        <ContainerActivator activate={[ServiceA, ServiceB]}>
          <div>test-label</div>
        </ContainerActivator>,
        mockContainer({ entries: [ServiceA, ServiceB] })
      )
    );

    expect(getByText("test-label")).toBeDefined();
  });

  it("should resolve listed services on first render", () => {
    const container: Container = mockContainer({ entries: [ServiceA, ServiceB] });
    const getSpy = jest.spyOn(container, "get");

    render(withContainerProvider(<ContainerActivator activate={[ServiceA, ServiceB]} />, container));

    expect(getServiceCallsCount(getSpy, ServiceA)).toBe(1);
    expect(getServiceCallsCount(getSpy, ServiceB)).toBe(1);
  });

  it("should resolve listed services on first render with strict mode", () => {
    const container: Container = mockContainer({ entries: [ServiceA, ServiceB] });
    const getSpy = jest.spyOn(container, "get");

    render(
      withContainerProvider(
        <StrictMode>
          <ContainerActivator activate={[ServiceA, ServiceB]} />
        </StrictMode>,
        container
      )
    );

    expect(getServiceCallsCount(getSpy, ServiceA)).toBe(2);
    expect(getServiceCallsCount(getSpy, ServiceB)).toBe(2);
  });

  it("should not resolve services again on rerender with same container", () => {
    const container: Container = mockContainer({ entries: [ServiceA, ServiceB] });
    const getSpy = jest.spyOn(container, "get");

    const { rerender } = render(
      withContainerProvider(<ContainerActivator activate={[ServiceA, ServiceB]} />, container)
    );

    rerender(withContainerProvider(<ContainerActivator activate={[ServiceA, ServiceB]} />, container));

    expect(getServiceCallsCount(getSpy, ServiceA)).toBe(1);
    expect(getServiceCallsCount(getSpy, ServiceB)).toBe(1);
  });

  it("should resolve services again when container changes", () => {
    const firstContainer: Container = mockContainer({ entries: [ServiceA, ServiceB] });
    const firstGetSpy = jest.spyOn(firstContainer, "get");

    const secondContainer: Container = mockContainer({ entries: [ServiceA, ServiceB] });
    const secondGetSpy = jest.spyOn(secondContainer, "get");

    const { rerender } = render(
      withContainerProvider(<ContainerActivator activate={[ServiceA, ServiceB]} />, firstContainer)
    );

    rerender(withContainerProvider(<ContainerActivator activate={[ServiceA, ServiceB]} />, secondContainer));

    expect(getServiceCallsCount(firstGetSpy, ServiceA)).toBe(1);
    expect(getServiceCallsCount(firstGetSpy, ServiceB)).toBe(1);

    expect(getServiceCallsCount(secondGetSpy, ServiceA)).toBe(1);
    expect(getServiceCallsCount(secondGetSpy, ServiceB)).toBe(1);
  });
});
