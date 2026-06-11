import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { Optional } from "../types/general";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  it("should return current container", () => {
    const container: Container = new Container();
    let componentContainer: Optional<Container> = null as Optional<Container>;

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
});
