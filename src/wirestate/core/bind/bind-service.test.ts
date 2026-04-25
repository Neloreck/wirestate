import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { Injectable } from "@/wirestate/alias";
import { bindService } from "@/wirestate/core/bind/bind-service";
import { ERROR_CODE_GENERIC } from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { OnQuery } from "@/wirestate/core/queries/on-query";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { SIGNAL_BUS_TOKEN, QUERY_BUS_TOKEN } from "@/wirestate/core/registry";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { mockContainer } from "@/wirestate/test-utils";

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

    // Test signal from external source.
    container.get<SignalBus>(SIGNAL_BUS_TOKEN).emit({ type: "TEST_STRING_SIGNAL", payload: "string-signal-data" });
    expect(instance.isTestStringSignalReceived).toBe(true);
    expect(instance.testStingSignalPayload).toBe("string-signal-data");

    // Test query from external source.
    expect(container.get<QueryBus>(QUERY_BUS_TOKEN).query("TEST_STRING_QUERY")).toBe("string-query-response");

    // Test deactivation.
    container.unbind(GenericService);
    expect(instance.isActivated).toBe(false);
    expect(instance.scope.isDisposed).toBe(true);

    // Verify query handler is removed
    expect(() => container.get<QueryBus>(QUERY_BUS_TOKEN).query("TEST_QUERY")).toThrow();
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

  it("should handle error in query unregister", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const container: Container = mockContainer();
    const queryBus: QueryBus = container.get(QUERY_BUS_TOKEN);

    // Mock register to return a failing unregister
    jest.spyOn(queryBus, "register").mockReturnValue(() => {
      throw new WirestateError(ERROR_CODE_GENERIC, "unregister-fail");
    });

    bindService(container, GenericService);

    container.get(GenericService);
    container.unbind(GenericService);

    expect(consoleSpy).toHaveBeenCalledWith("[wirestate] query unregister threw:", expect.any(WirestateError));

    consoleSpy.mockRestore();
  });

  it("should handle non-function @OnQuery or @OnActivated properties during activation", () => {
    const container: Container = mockContainer();

    bindService(container, CorruptedService);

    // This should not throw exceptions with corrupted 'activation' handlers.
    const instance: CorruptedService = container.get(CorruptedService);

    expect(instance).toBeDefined();
    expect(() => container.get<QueryBus>(QUERY_BUS_TOKEN).query("CORRUPTED_QUERY")).toThrow(
      "No query handler registered in container for type: 'CORRUPTED_QUERY'."
    );
  });
});
