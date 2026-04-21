import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { mockService } from "@/wirestate/test-utils/mock-service";

describe("AbstractService", () => {
  const illegalBeforeAccessError =
    "AbstractService::container accessed before activation. " +
    "Ensure service is bound to container and is properly resolved.";
  const illegalAfterAccessError =
    "AbstractService::container accessed after deactivation. " +
    "Ensure service is properly disposed and MobX refs are observing latest services.";

  it("should initialise generic services with correct state without container", () => {
    const service: GenericService = new GenericService();

    expect(service).toBeInstanceOf(AbstractService);
    expect(service.IS_DISPOSED).toBeNull();
    expect(service.onSignal).toBeUndefined();
    expect(() => service.testGetContainer()).toThrow(illegalBeforeAccessError);
    expect(() => service.testResolveService()).toThrow(illegalBeforeAccessError);
    expect(() => service.testGetInitialState()).toThrow(illegalBeforeAccessError);
    expect(() => service.testEmitSignal()).toThrow(illegalBeforeAccessError);
    expect(() => service.testQueryData()).toThrow(illegalBeforeAccessError);
  });

  it("should initialise generic services with correct state within container", () => {
    const container: Container = mockContainer();
    const service: GenericService = mockService(GenericService, container);

    mockBindService(container, GenericService);

    expect(service).toBeInstanceOf(AbstractService);
    expect(service.IS_DISPOSED).toBe(false);
    expect(service.isActivated).toBe(true);
    expect(service.onSignal).toBeUndefined();
    expect(() => service.testGetContainer()).not.toThrow(illegalBeforeAccessError);
    expect(() => service.testResolveService()).not.toThrow(illegalBeforeAccessError);
    expect(() => service.testGetInitialState()).not.toThrow(illegalBeforeAccessError);
    expect(() => service.testEmitSignal()).not.toThrow(illegalBeforeAccessError);
    expect(() => service.testQueryData()).not.toThrow(illegalBeforeAccessError);
  });

  it("should throw errors after disposal (container actions)", () => {
    const container: Container = mockContainer();
    const service: GenericService = mockService(GenericService, container);

    mockBindService(container, GenericService);

    container.unbind(GenericService);

    expect(service).toBeInstanceOf(AbstractService);
    expect(service.IS_DISPOSED).toBe(true);
    expect(service.isActivated).toBe(false);
    expect(service.onSignal).toBeUndefined();
    expect(() => service.testGetContainer()).toThrow(illegalAfterAccessError);
    expect(() => service.testResolveService()).toThrow(illegalAfterAccessError);
    expect(() => service.testGetInitialState()).toThrow(illegalAfterAccessError);
    expect(() => service.testEmitSignal()).toThrow(illegalAfterAccessError);
    expect(() => service.testQueryData()).toThrow(illegalAfterAccessError);
  });
});
