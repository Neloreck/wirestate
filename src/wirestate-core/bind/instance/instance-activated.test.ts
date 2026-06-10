import { Container } from "../../base";
import { createContainer } from "../../container/create-container";
import { ACTIVE_INSTANCES_BY_CONTAINER } from "../../registry";

import { createInstanceActivatedHandler } from "./instance-activated";
import { OnActivated } from "./on-activated";

describe("createInstanceActivatedHandler", () => {
  it("should track activated instances by container", () => {
    class TestService {}

    const container: Container = createContainer();
    const instance: TestService = new TestService();

    const activate = createInstanceActivatedHandler({
      binding: TestService,
      container,
    });

    expect(ACTIVE_INSTANCES_BY_CONTAINER.get(container)).toBeUndefined();
    expect(activate(instance)).toBe(instance);
    expect(ACTIVE_INSTANCES_BY_CONTAINER.get(container)?.has(instance)).toBe(true);
  });

  it("should clean up tracked instances when activation fails", () => {
    class TestService {
      @OnActivated()
      public onActivated(): void {
        throw new Error("activation-fail");
      }
    }

    const onError = jest.fn();

    const container: Container = createContainer({ onError });
    const instance: TestService = new TestService();

    const activate = createInstanceActivatedHandler({
      binding: TestService,
      container,
    });

    expect(() => activate(instance)).toThrow("activation-fail");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(ACTIVE_INSTANCES_BY_CONTAINER.get(container)).toBeUndefined();
  });
});
