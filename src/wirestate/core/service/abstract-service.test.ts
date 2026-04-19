import { Container } from "inversify";

import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { mockService } from "@/wirestate/test-utils/mock-service";

describe("AbstractService", () => {
  const illegalAccessError =
    "AbstractService::container accessed before activation. " +
    "Ensure service is bound to container and is properly resolved.";

  class GenericService extends AbstractService {
    public isActivated: boolean = false;

    public onActivated(): void {
      this.isActivated = true;
    }

    public testGetService() {
      return this.getService(GenericService);
    }

    public testGetContainer(): Container {
      return this.getContainer();
    }

    public testGetInitialState(): Container {
      return this.getInitialState();
    }

    public testEmitSignal(): void {
      this.emitSignal({ type: "test", payload: 0 });
    }

    public testQueryData(): void {
      this.queryData("TYPE", { data: 1 });
    }
  }

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
