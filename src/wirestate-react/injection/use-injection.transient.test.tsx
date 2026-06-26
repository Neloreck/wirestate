/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import { BindingType, Container, Injectable } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";

import { useInjection } from "./use-injection";

describe("useInjection transient instance binding", () => {
  it("should resolve a fresh transient instance for distinct consumers", () => {
    let counter: number = 0;

    @Injectable()
    class CounterService {
      public readonly id: number = (counter += 1);
    }

    const container: Container = new Container({
      bindings: [{ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" }],
    });

    function Probe({ testid }: { testid: string }) {
      const service: CounterService = useInjection(CounterService);

      return <div data-testid={testid}>{service.id}</div>;
    }

    const { getByTestId } = render(
      <ContainerProvider container={container}>
        <Probe testid={"a"} />
        <Probe testid={"b"} />
      </ContainerProvider>
    );

    // Each consumer resolves its own fresh instance - distinct ids prove transient construction.
    expect(getByTestId("a").textContent).not.toBe(getByTestId("b").textContent);
  });

  it("should keep one consumer's transient instance stable across re-renders", () => {
    let counter: number = 0;

    @Injectable()
    class CounterService {
      public readonly id: number = (counter += 1);
    }

    const container: Container = new Container({
      bindings: [{ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" }],
    });

    function Probe() {
      const service: CounterService = useInjection(CounterService);

      return <div data-testid={"probe"}>{service.id}</div>;
    }

    const tree = (
      <ContainerProvider container={container}>
        <Probe />
      </ContainerProvider>
    );

    const { getByTestId, rerender } = render(tree);
    const first = getByTestId("probe").textContent;

    for (let it = 0; it < 10; it++) {
      rerender(tree);
    }

    // useInjection memoizes per [container, token], so the consumer keeps its instance.
    expect(getByTestId("probe").textContent).toBe(first);
  });
});
