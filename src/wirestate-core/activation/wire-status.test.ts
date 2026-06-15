import { OnDeprovision, OnProvision } from "@wirestate/core";

import { Container } from "../container/container";
import { Injectable } from "../metadata/metadata-injectable";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";

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

    const container: Container = new Container();

    container.bind(TestService);

    const service: TestService = container.get(TestService);

    expect(WireStatus.for(service)).toBe(service.status);
    expect(service.status).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should track activation, provider ownership, and deactivation by instance reference", () => {
    @Injectable()
    class TestService {}

    const container: Container = new Container();

    container.bind(TestService);

    const service: TestService = container.get(TestService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toBeInstanceOf(WireStatus);
    expect(WireStatus.for(service)).toBe(status);
    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    provisionContainer(container, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: null,
    });

    deprovisionContainer(container);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });

    container.unbind(TestService);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: true,
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

    const container: Container = new Container();

    container.bind(TestService);

    const service: TestService = container.get(TestService);
    const status: WireStatus = WireStatus.for(service);

    expect(status).toBeInstanceOf(WireStatus);
    expect(WireStatus.for(service)).toBe(status);
    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    provisionContainer(container, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: 1,
    });

    deprovisionContainer(container);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 1,
    });

    provisionContainer(container, [TestService]);

    expect(WireStatus.for(service)).toBe(status);
    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: false,
      isInactive: false,
      provisionId: 2,
    });

    deprovisionContainer(container);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: false,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 2,
    });

    container.unbind(TestService);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 2,
    });
  });

  it("initializes isDeprovisioned from the container's provision status at activation time", () => {
    @Injectable()
    class Service {}

    // (a) Activated on a never-provisioned container: status is unknown -> null.
    const neverProvisioned: Container = new Container({ bindings: [Service] });

    expect(WireStatus.for(neverProvisioned.get(Service)).isDeprovisioned).toBeNull();

    // (b) Activated while the container is provisioned -> false (live).
    const provisioned: Container = new Container({ bindings: [Service] });

    provisionContainer(provisioned);

    expect(WireStatus.for(provisioned.get(Service)).isDeprovisioned).toBe(false);

    // (c) Activated after the container was deprovisioned -> true.
    const deprovisioned: Container = new Container({ bindings: [Service] });

    provisionContainer(deprovisioned);
    deprovisionContainer(deprovisioned);

    expect(WireStatus.for(deprovisioned.get(Service)).isDeprovisioned).toBe(true);
  });
});
