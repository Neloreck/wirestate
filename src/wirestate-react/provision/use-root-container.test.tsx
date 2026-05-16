import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { Optional } from "../types/general";

import { useRootContainer } from "./use-root-container";

describe("useRootContainer", () => {
  it("should create and return root container on first render", () => {
    const container: Container = mockContainer();
    const factory = jest.fn<Container, []>(() => container);

    let componentContainer: Optional<Container> = null as Optional<Container>;

    function TestComponent() {
      componentContainer = useRootContainer(factory, []);

      return null;
    }

    const { rerender } = render(<TestComponent />);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(componentContainer).toBe(container);

    rerender(<TestComponent />);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(componentContainer).toBe(container);
  });

  it("should recreate container when deps change", () => {
    const firstContainer: Container = mockContainer();
    const secondContainer: Container = new Container();

    const factory = jest
      .fn()
      .mockImplementationOnce(() => firstContainer)
      .mockImplementationOnce(() => secondContainer);

    let componentContainer: Optional<Container> = null as Optional<Container>;

    function TestComponent(props: { readonly deps: Array<unknown> }) {
      componentContainer = useRootContainer(factory, props.deps);

      return null;
    }

    const { rerender } = render(<TestComponent deps={[1]} />);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(componentContainer).toBe(firstContainer);

    rerender(<TestComponent deps={[2]} />);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(componentContainer).toBe(secondContainer);
  });
});
