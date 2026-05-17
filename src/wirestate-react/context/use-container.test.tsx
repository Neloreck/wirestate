import { render } from "@testing-library/react";
import { Container, createContainer } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { Optional } from "../types/general";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  it("should return current container", () => {
    const container: Container = createContainer();
    let componentContainer: Optional<Container> = null as Optional<Container>;

    function TestComponent() {
      componentContainer = useContainer();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(componentContainer).not.toBeNull();
    expect(componentContainer).toBeInstanceOf(Container);
    expect(componentContainer).toBe(container);
  });
});
