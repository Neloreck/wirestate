import { Container } from "@wirestate/core";

import { ReactContainerProvisionLifecycle, retainContainer, scheduleContainerDestruction } from "./provision-lifecycle";

describe("react container provision lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not deprovision twice when destruction is already scheduled for a container", () => {
    const container: Container = new Container();
    const deprovision = jest.spyOn(container, "deprovision");
    const pending: ReactContainerProvisionLifecycle = new Map();

    scheduleContainerDestruction(container, pending);
    // A second schedule for the same still-pending container is a no-op.
    scheduleContainerDestruction(container, pending);

    expect(deprovision).toHaveBeenCalledTimes(1);
    expect(pending.has(container)).toBe(true);
  });

  it("cancels a pending destruction when the container is retained", () => {
    const container: Container = new Container();
    const unbindAll = jest.spyOn(container, "unbindAll");
    const pending: ReactContainerProvisionLifecycle = new Map();

    scheduleContainerDestruction(container, pending);
    retainContainer(container, pending);

    expect(pending.has(container)).toBe(false);

    // The destruction timer was cleared, so the container is never torn down.
    jest.runOnlyPendingTimers();

    expect(unbindAll).not.toHaveBeenCalled();
  });
});
