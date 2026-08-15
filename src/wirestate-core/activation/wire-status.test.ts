import { OnDeprovision, OnProvision } from "@wirestate/core";

import { Container } from "../container/container";
import { ERROR_CODE_NOT_TRACKED } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";
import { type Nullable } from "../types/general";

import { type ProvisionId, WireStatus } from "./wire-status";

describe("WireStatus", () => {
  it("should throw for untracked objects", () => {
    expect(() => WireStatus.for({})).toThrow("Object is not tracked by Wirestate.");
    expect(() => WireStatus.for({})).toThrow(expect.objectContaining({ code: ERROR_CODE_NOT_TRACKED }));
  });

  it("should start tracking an untracked object and reuse the status on repeated tracking", () => {
    const instance: object = {};
    const status: WireStatus = WireStatus.track(instance);

    expect(status).toBeInstanceOf(WireStatus);
    expect(WireStatus.for(instance)).toBe(status);
    expect(WireStatus.track(instance)).toBe(status);
    expect(status).toEqual({
      isDeactivated: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });
  });

  it("should reuse a status reserved during construction", () => {
    @Injectable()
    class TestService {
      public readonly status: WireStatus = WireStatus.track(this);
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

    // Declaring no hook does not keep a service out of the cycle, so it is stamped like any other
    // instance the container owns. Without an id, `isStale` could not tell a later cycle apart.
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

    container.unbind(TestService);

    expect(WireStatus.for(service)).toEqual({
      isDeactivated: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: 1,
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

  describe("isStale", () => {
    @Injectable()
    class TestService {
      @OnProvision()
      public onProvision(): void {}

      @OnDeprovision()
      public onDeprovision(): void {}
    }

    it("should not be stale within the provision cycle the work belongs to", () => {
      const container: Container = new Container({ bindings: [TestService] });
      const status: WireStatus = WireStatus.for(container.get(TestService));

      provisionContainer(container, [TestService]);

      expect(status.provisionId).toBe(1);
      expect(status.isStale(1)).toBe(false);
    });

    it("should be stale once a newer provision cycle supersedes the work", () => {
      const container: Container = new Container({ bindings: [TestService] });
      const status: WireStatus = WireStatus.for(container.get(TestService));

      provisionContainer(container, [TestService]);
      deprovisionContainer(container);
      provisionContainer(container, [TestService]);

      expect(status.provisionId).toBe(2);
      expect(status.isStale(1)).toBe(true);
      expect(status.isStale(2)).toBe(false);
    });

    it("should be stale after deprovision, where the provision id alone still matches", () => {
      const container: Container = new Container({ bindings: [TestService] });
      const status: WireStatus = WireStatus.for(container.get(TestService));

      provisionContainer(container, [TestService]);
      deprovisionContainer(container);

      // Deprovision restores the id the hook received, so an id comparison alone would pass here.
      expect(status.provisionId).toBe(1);
      expect(status.isStale(1)).toBe(true);
    });

    it("should be stale after deactivation, where the provision id alone still matches", () => {
      const container: Container = new Container({ bindings: [TestService] });
      const status: WireStatus = WireStatus.for(container.get(TestService));

      provisionContainer(container, [TestService]);
      container.unbind(TestService);

      // Deactivation never touches the id, so an id comparison alone would pass here too.
      expect(status.isDeactivated).toBe(true);
      expect(status.provisionId).toBe(1);
      expect(status.isStale(1)).toBe(true);
    });

    it("should be stale for a service declaring no provider hooks once a newer cycle starts", () => {
      // The shape the docs recommend for guarding async work outside the lifecycle hooks: no
      // @OnProvision, status held as a field, id snapshotted before the await. Leaving such a
      // service unstamped would pin its id at null across every cycle, so `isStale` could only
      // ever report deactivation and would let a result from a superseded cycle through.
      @Injectable()
      class PlainService {}

      const container: Container = new Container({ bindings: [PlainService] });
      const status: WireStatus = WireStatus.for(container.get(PlainService));

      provisionContainer(container, [PlainService]);

      const snapshot: Nullable<ProvisionId> = status.provisionId;

      expect(snapshot).toBe(1);
      expect(status.isStale(snapshot)).toBe(false);

      deprovisionContainer(container);
      provisionContainer(container, [PlainService]);

      expect(status.provisionId).toBe(2);
      expect(status.isStale(snapshot)).toBe(true);
    });

    it("should treat a null snapshot as current until a provision cycle starts", () => {
      const container: Container = new Container({ bindings: [TestService] });
      const status: WireStatus = WireStatus.for(container.get(TestService));

      // Snapshotted before any provider lifecycle reached the instance.
      expect(status.provisionId).toBeNull();
      expect(status.isStale(null)).toBe(false);

      provisionContainer(container, [TestService]);

      expect(status.isStale(null)).toBe(true);
    });
  });
});
