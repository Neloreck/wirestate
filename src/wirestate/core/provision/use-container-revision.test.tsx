import { render } from "@testing-library/react";
import { Container } from "inversify";

import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { useContainerRevision } from "@/wirestate/core/provision/use-container-revision";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";

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
