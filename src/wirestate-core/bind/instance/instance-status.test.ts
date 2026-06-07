import { Container } from "../../alias";
import { createContainer } from "../../container/create-container";
import { WireStatus } from "../../container/wire-status";
import { PROVISION_STATUS_BY_CONTAINER } from "../../registry";

import { initializeInstanceStatus, unregisterInstanceStatus } from "./instance-status";

describe("instance status", () => {
  it("should initialize an untracked instance with null provider status", () => {
    const container: Container = createContainer();
    const instance: object = {};

    expect(() => WireStatus.for(instance)).toThrow("Object is not tracked by Wirestate.");

    initializeInstanceStatus(container, instance);

    expect(WireStatus.for(instance)).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should derive deprovisioned status from container provision state", () => {
    const provisionedContainer: Container = createContainer();
    const deprovisionedContainer: Container = createContainer();
    const provisionedInstance: object = {};
    const deprovisionedInstance: object = {};

    PROVISION_STATUS_BY_CONTAINER.set(provisionedContainer, true);
    PROVISION_STATUS_BY_CONTAINER.set(deprovisionedContainer, false);

    initializeInstanceStatus(provisionedContainer, provisionedInstance);
    initializeInstanceStatus(deprovisionedContainer, deprovisionedInstance);

    expect(WireStatus.for(provisionedInstance).isDeprovisioned).toBe(false);
    expect(WireStatus.for(deprovisionedInstance).isDeprovisioned).toBe(true);
  });

  it("should reuse and reset a reserved status during initialization", () => {
    const container: Container = createContainer();
    const instance: object = {};
    const status: WireStatus = WireStatus.for(instance, { initialize: true });

    status.isDisposed = true;
    status.isDeprovisioned = true;
    status.provisionId = 10;

    initializeInstanceStatus(container, instance);

    expect(WireStatus.for(instance)).toBe(status);
    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should mark an initialized instance as disposed and deprovisioned on unregister", () => {
    const container: Container = createContainer();
    const instance: object = {};

    initializeInstanceStatus(container, instance);
    unregisterInstanceStatus(instance);

    expect(WireStatus.for(instance)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });
});
