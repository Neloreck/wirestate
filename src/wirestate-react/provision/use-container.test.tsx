import { render } from "@testing-library/react";
import { Container, createIocContainer } from "@wirestate/core";

import { withIocProvider } from "../test-utils/with-ioc-provider";
import { Optional } from "../types/general";

import { useContainer } from "./use-container";

describe("useContainer", () => {
  it("should return current container", () => {
    const container: Container = createIocContainer();
    let componentContainer: Optional<Container> = null as Optional<Container>;

    function TestComponent() {
      componentContainer = useContainer();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(componentContainer).not.toBeNull();
    expect(componentContainer).toBeInstanceOf(Container);
    expect(componentContainer).toBe(container);
  });
});
