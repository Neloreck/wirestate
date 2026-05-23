import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { Inject, Injectable } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { WireScope } from "../container/wire-scope";
import { EventBus } from "../events/event-bus";
import { OnQuery } from "../queries/on-query";
import { QueryBus } from "../queries/query-bus";
import { OnActivated } from "../service/on-activated";
import { OnDeactivation } from "../service/on-deactivation";
import { mockContainer } from "../test-utils";
import { CommandStatus } from "../types/commands";

import { bindService } from "./bind-service";

interface ReflectMetadata {
  getMetadata?: (metadataKey: string, target: object) => unknown;
}

describe("bindService", () => {
  @Injectable()
  class AsyncFailService {
    @OnActivated()
    public async onActivated(): Promise<void> {
      throw new Error("async-fail");
    }
  }

  @Injectable()
  class SyncFailActivationService {
    public wasResolved: boolean = false;

    @OnActivated()
    public onActivated(): void {
      this.wasResolved = true;

      throw new Error("sync-activation-fail");
    }
  }

  @Injectable()
  class SyncFailDeactivationService {
    public constructor(
      @Inject(WireScope)
      public readonly scope: WireScope
    ) {}

    @OnDeactivation()
    public onDeactivation(): void {
      throw new Error("sync-deactivation-fail");
    }

    @OnQuery("SYNC_FAIL_DEACTIVATION_QUERY")
    public onQuery(): string {
      return "query-response";
    }
  }

  @Injectable()
  class CorruptedService {
    // @ts-ignore - Sabotage with non-function
    @OnQuery("CORRUPTED_QUERY")
    public corruptedQuery: string = "not-a-function";

    // @ts-ignore - Sabotage with non-function
    @OnActivated()
    public sabotagedActivated: string = "not-a-function";
  }

  it("should bind service and handle lifecycle", async () => {
    const container: Container = mockContainer();

    bindService(container, GenericService);

    expect(container.isBound(GenericService)).toBe(true);

    const instance: GenericService = container.get(GenericService);

    expect(instance.isActivated).toBe(true);
    expect(instance.scope.isDisposed).toBe(false);

    // Test event from external source.
    container.get(EventBus).emit({ type: "TEST_STRING_EVENT", payload: "string-event-data" });
    expect(instance.isTestStringEventReceived).toBe(true);
    expect(instance.testStingEventPayload).toBe("string-event-data");

    // Test query from external source.
    expect(container.get(QueryBus).query("TEST_STRING_QUERY")).toBe("string-query-response");

    // Test command from external source.
    expect(container.get(CommandBus).command("TEST_SYNC_COMMAND", 800)).toEqual({
      status: CommandStatus.PENDING,
      task: expect.any(Promise),
    });
    expect(await container.get(CommandBus).command("TEST_SYNC_COMMAND", 800).task).toBe(1800);

    // Test deactivation.
    container.unbind(GenericService);
    expect(instance.isActivated).toBe(false);
    expect(instance.scope.isDisposed).toBe(true);

    // Verify query handler is removed
    expect(() => container.get(QueryBus).query("TEST_QUERY")).toThrow();
  });

  it("should skip lifecycle if isWithIgnoreLifecycle is true", () => {
    const container: Container = mockContainer();

    bindService(container, GenericService, { isWithIgnoreLifecycle: true });

    const instance: GenericService = container.get(GenericService);

    expect(instance.isActivated).toBe(false);
    expect(instance.scope.isDisposed).toBe(false);
  });

  it("should handle async @OnActivated and catch errors", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = mockContainer();

    bindService(container, AsyncFailService);

    container.get(AsyncFailService);

    // Need to wait for next tick for the caught promise.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "[wirestate] @OnActivated rejected for:",
      "AsyncFailService",
      "onActivated",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should throw on failing @OnActivated methods without failing resolution", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = mockContainer();

    bindService(container, SyncFailActivationService);

    expect(() => container.get(SyncFailActivationService)).toThrow("sync-activation-fail");

    consoleSpy.mockRestore();
  });

  it("should catch and log failing @OnDeactivation methods while preserving cleanup", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = mockContainer();

    bindService(container, SyncFailDeactivationService);

    const instance: SyncFailDeactivationService = container.get(SyncFailDeactivationService);

    expect(container.get(QueryBus).query("SYNC_FAIL_DEACTIVATION_QUERY")).toBe("query-response");
    expect(() => container.unbind(SyncFailDeactivationService)).not.toThrow();
    expect(instance.scope.isDisposed).toBe(true);
    expect(container.get(QueryBus).has("SYNC_FAIL_DEACTIVATION_QUERY")).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[wirestate] @OnDeactivation failed for:",
      "SyncFailDeactivationService",
      "onDeactivation",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should handle non-function @OnQuery or @OnActivated properties during activation", () => {
    const container: Container = mockContainer();

    bindService(container, CorruptedService);

    // This should not throw exceptions with corrupted 'activation' handlers.
    const instance: CorruptedService = container.get(CorruptedService);

    expect(instance).toBeDefined();
    expect(() => container.get(QueryBus).query("CORRUPTED_QUERY")).toThrow(
      "No query handler registered in container for type: 'CORRUPTED_QUERY'."
    );
  });

  it("should throw a readable error when reflect-metadata is not installed", () => {
    @Injectable()
    class ServiceWithoutMetadataPolyfill {}

    const reflectMetadata: ReflectMetadata = Reflect as ReflectMetadata;
    const originalGetMetadata = reflectMetadata.getMetadata;
    const container: Container = mockContainer();

    try {
      delete reflectMetadata.getMetadata;

      bindService(container, ServiceWithoutMetadataPolyfill);

      expect(() => container.get(ServiceWithoutMetadataPolyfill)).toThrow(
        'reflect-metadata is required for Wirestate service activation. Import "reflect-metadata" once at your application entry point before creating Wirestate containers.'
      );
    } finally {
      reflectMetadata.getMetadata = originalGetMetadata;
    }
  });
});
