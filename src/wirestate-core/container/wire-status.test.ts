import { OnDeprovision, OnProvision } from "@wirestate/core";

import { Container, Injectable } from "../alias";
import { bind } from "../bind/bind";

import { ContainerProvisionLifecycle, deprovisionContainer, provisionContainer } from "./container-provision-lifecycle";
import { createContainer } from "./create-container";
import { WireStatus } from "./wire-status";

describe("WireStatus", () => {
  it("should throw for unmanaged objects without initialization", () => {
    expect(() => WireStatus.for({})).toThrow("Object is not tracked by Wirestate.");
  });

  it("should reuse a status reserved during construction", () => {
    @Injectable()
    class TestService {
      public readonly status: WireStatus = WireStatus.for(this, { initialize: true });
    }

    const container: Container = createContainer();

    bind(container, TestService);

    const service: TestService = container.get(TestService);

    expect(WireStatus.for(service)).toBe(service.status);
    expect(service.status).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should track activation, provider ownership, and deactivation by instance reference", () => {
    @Injectable()
    class TestService {}

    const container: Container = createContainer();
    const lifecycle: ContainerProvisionLifecycle = new Map();

    bind(container, TestService);

    const service: TestService = container.get(TestService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toBeInstanceOf(WireStatus);
    expect(WireStatus.for(service)).toBe(status);
    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    provisionContainer(container, lifecycle, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container, lifecycle);

    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });

    container.unbind(TestService);

    expect(WireStatus.for(service)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should track activation, provider ownership, and deactivation by instance reference with lifecycle", () => {
    @Injectable()
    class TestService {
      @OnProvision()
      public onProvision(): void {}

      @OnDeprovision()
      public onDeprovision(): void {}
    }

    const container: Container = createContainer();
    const lifecycle: ContainerProvisionLifecycle = new Map();

    bind(container, TestService);

    const service: TestService = container.get(TestService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toBeInstanceOf(WireStatus);
    expect(WireStatus.for(service)).toBe(status);
    expect(status).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    provisionContainer(container, lifecycle, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: 1,
    });

    deprovisionContainer(container, lifecycle);

    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 1,
    });

    provisionContainer(container, lifecycle, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: 2,
    });

    deprovisionContainer(container, lifecycle);

    expect(WireStatus.for(service)).toEqual({
      isDisposed: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 2,
    });

    container.unbind(TestService);

    expect(WireStatus.for(service)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 2,
    });
  });
});
