import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { Injectable } from "@/wirestate-core/alias";
import { bindService } from "@/wirestate-core/bind/bind-service";
import { CommandBus } from "@/wirestate-core/commands/command-bus";
import { EventBus } from "@/wirestate-core/events/event-bus";
import { OnQuery } from "@/wirestate-core/queries/on-query";
import { QueryBus } from "@/wirestate-core/queries/query-bus";
import { OnActivated } from "@/wirestate-core/service/on-activated";
import { mockContainer } from "@/wirestate-core/test-utils";
import { CommandStatus } from "@/wirestate-core/types/commands";

describe("bindService", () => {
  @Injectable()
  class AsyncFailService {
    @OnActivated()
    public async onActivated(): Promise<void> {
      throw new Error("async-fail");
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
});
