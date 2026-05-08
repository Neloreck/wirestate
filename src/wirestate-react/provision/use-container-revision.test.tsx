import { render } from "@testing-library/react";
import { Container, createIocContainer } from "@wirestate/core";

import { withIocProvider } from "../test-utils/with-ioc-provider";

import { useContainerRevision } from "./use-container-revision";

describe("useContainerRevision", () => {
  it("should return container revision", () => {
    const container: Container = createIocContainer();
    let revision: number = -1;

    function TestComponent() {
      revision = useContainerRevision();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(revision).toBe(1);
  });
});
