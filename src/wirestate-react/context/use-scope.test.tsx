import { render } from "@testing-library/react";
import { Container, WireScope } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { Optional } from "../types/general";

import { useScope } from "./use-scope";

describe("useScope", () => {
  it("should return current container scope", () => {
    const container: Container = new Container();
    let scope: Optional<WireScope> = null as Optional<WireScope>;

    function TestComponent() {
      scope = useScope();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(scope).not.toBeNull();
    expect(scope).toBeInstanceOf(WireScope);
    expect(scope).not.toBe(container.get(WireScope));
    expect(scope?.resolve(Container)).toBe(container);
  });
});
