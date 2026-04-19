import { GenericService } from "@/fixtures/services/generic-service";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { mockService } from "@/wirestate/test-utils/mock-service";

describe("AbstractService", () => {
  const illegalAccessError =
    "AbstractService::container accessed before activation. " +
    "Ensure service is bound to container and is properly resolved.";

  it("should initialise generic services with correct state without container", () => {
    const service = new GenericService();

    expect(service).toBeInstanceOf(AbstractService);
    expect(service.IS_DISPOSED).toBe(false);
    expect(service.onSignal).toBeUndefined();
    expect(() => service.testGetContainer()).toThrow(illegalAccessError);
    expect(() => service.testGetService()).toThrow(illegalAccessError);
    expect(() => service.testGetInitialState()).toThrow(illegalAccessError);
    expect(() => service.testEmitSignal()).toThrow(illegalAccessError);
    expect(() => service.testQueryData()).toThrow(illegalAccessError);
  });

  it("should initialise generic services with correct state within container", () => {
    const container = mockContainer();
    const service = mockService(GenericService, container);

    mockBindService(container, GenericService);

    expect(service).toBeInstanceOf(AbstractService);
    expect(service.IS_DISPOSED).toBe(false);
    expect(service.isActivated).toBe(true);
    expect(service.onSignal).toBeUndefined();
    expect(() => service.testGetContainer()).not.toThrow(illegalAccessError);
    expect(() => service.testGetService()).not.toThrow(illegalAccessError);
    expect(() => service.testGetInitialState()).not.toThrow(illegalAccessError);
    expect(() => service.testEmitSignal()).not.toThrow(illegalAccessError);
    expect(() => service.testQueryData()).not.toThrow(illegalAccessError);
  });
});
