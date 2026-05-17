import { render } from "@testing-library/react";
import { Container, createContainer, WireScope } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { Optional } from "../types/general";

import { useScope } from "./use-scope";

describe("useScope", () => {
  it("should return current container scope", () => {
    const container: Container = createContainer();
    let scope: Optional<WireScope> = null as Optional<WireScope>;

    function TestComponent() {
      scope = useScope();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(scope).not.toBeNull();
    expect(scope).toBeInstanceOf(WireScope);
    expect(scope).not.toBe(container.get(WireScope));
    expect(scope?.getContainer()).toBe(container);
  });
});
