/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type Nullable } from "../types/general";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  it("should return current container", () => {
    const container: Container = new Container();
    let componentContainer: Nullable<Container> = null as Nullable<Container>;

    function TestComponent() {
      componentContainer = useContainer();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(componentContainer).not.toBeNull();
    expect(componentContainer).toBeInstanceOf(Container);
    expect(componentContainer).toBe(container);
  });

  it("should throw when used outside a ContainerProvider", () => {
    const errorSpy = jest.spyOn(window.console, "error").mockImplementation(() => {});

    function Orphan() {
      useContainer();

      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      "Trying to access container context from React subtree not wrapped in <ContainerProvider>."
    );

    errorSpy.mockRestore();
  });
});
