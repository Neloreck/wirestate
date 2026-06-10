import { Container } from "../../base";
import { createContainer } from "../../container/create-container";
import { ACTIVE_INSTANCES_BY_CONTAINER } from "../../registry";

import { createInstanceActivatedHandler } from "./instance-activated";
import { createInstanceDeactivationHandler } from "./instance-deactivation";

describe("createInstanceDeactivationHandler", () => {
  it("should untrack deactivated instances by container", () => {
    class TestService {}

    const container: Container = createContainer();
    const instance: TestService = new TestService();

    const activate = createInstanceActivatedHandler({
      binding: TestService,
      container,
    });

    const deactivate = createInstanceDeactivationHandler({
      binding: TestService,
      container,
    });

    activate(instance);

    expect(ACTIVE_INSTANCES_BY_CONTAINER.get(container)?.has(instance)).toBe(true);

    deactivate(instance);

    expect(ACTIVE_INSTANCES_BY_CONTAINER.get(container)).toBeUndefined();
  });
});
