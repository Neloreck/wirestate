import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType, Container, inject, Injectable } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { OnCommand } from "../commands/on-command";
import { createContainer } from "../container/create-container";
import { WireScope } from "../container/wire-scope";
import { WireStatus } from "../container/wire-status";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { EventBus } from "../events/event-bus";
import { OnEvent } from "../events/on-event";
import { OnQuery } from "../queries/on-query";
import { QueryBus } from "../queries/query-bus";
import { Optional } from "../types/general";
import { InstanceBindingDescriptor } from "../types/provision";

import { bindInstance, bindInstanceWithToken } from "./bind-instance";
import { OnActivated } from "./instance/on-activated";
import { OnDeactivation } from "./instance/on-deactivation";
import { unbindAll } from "./unbind";

describe("bindInstance", () => {
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
    public constructor(public readonly scope: WireScope = inject(WireScope)) {}

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

  it("should bind instances and handle lifecycle", async () => {
    const container: Container = createContainer();

    const result: Container = bindInstance(container, GenericService);

    expect(result).toBe(container);
    expect(container.has(GenericService)).toBe(true);

    const instance: GenericService = container.get(GenericService);

    expect(instance.isActivated).toBe(true);
    expect(WireStatus.for(instance)).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    // Test event from external source.
    container.get(EventBus).emit("TEST_STRING_EVENT", "string-event-data");
    expect(instance.isTestStringEventReceived).toBe(true);
    expect(instance.testStingEventPayload).toBe("string-event-data");

    // Test query from external source.
    expect(container.get(QueryBus).query("TEST_STRING_QUERY")).toBe("string-query-response");

    // Test command from external source.
    expect(container.get(CommandBus).execute("TEST_SYNC_COMMAND", 800)).toBe(1800);

    // Test deactivation.
    container.unbind(GenericService);
    expect(instance.isActivated).toBe(false);
    expect(instance.scope.resolve(Container)).toBe(container);
    expect(WireStatus.for(instance)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });

    // Verify query handler is removed
    expect(() => container.get(QueryBus).query("TEST_QUERY")).toThrow();
  });

  it("should skip activation hooks while keeping message decorators wired", () => {
    const container: Container = createContainer();

    bindInstance(container, GenericService, { skipActivationHooks: true });

    const instance: GenericService = container.get(GenericService);

    expect(instance.isActivated).toBe(false);
    expect(WireStatus.for(instance)).toEqual({
      isDisposed: false,
      isDeprovisioned: null,
      isInactive: false,
      provisionId: null,
    });

    container.get(EventBus).emit("TEST_STRING_EVENT", "string-event-data");

    expect(instance.isTestStringEventReceived).toBe(true);
    expect(instance.testStingEventPayload).toBe("string-event-data");
    expect(container.get(QueryBus).query("TEST_STRING_QUERY")).toBe("string-query-response");
    expect(container.get(CommandBus).execute("TEST_SYNC_COMMAND", 800)).toBe(1800);

    container.unbind(GenericService);

    expect(container.get(QueryBus).hasHandler("TEST_STRING_QUERY")).toBe(false);
    expect(container.get(CommandBus).hasHandler("TEST_SYNC_COMMAND")).toBe(false);
    expect(WireStatus.for(instance)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });
  });

  it("should throw for instance descriptor without constructor value", () => {
    const container: Container = createContainer();
    const binding = {
      type: BindingType.Instance,
      token: GenericService,
      value: "not-a-constructor",
    } as unknown as InstanceBindingDescriptor;

    expect(() => bindInstanceWithToken(container, GenericService, binding.value as never, binding, {})).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindInstanceWithToken(container, GenericService, binding.value as never, binding, {})).toThrow(
      "Instance descriptor 'value' must be a constructor."
    );
  });

  it("should throw for instance descriptor without token", () => {
    const container: Container = createContainer();
    const binding = {
      type: BindingType.Instance,
      value: GenericService,
    } as unknown as InstanceBindingDescriptor;

    expect(() => bindInstanceWithToken(container, GenericService, GenericService, binding, {})).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindInstanceWithToken(container, GenericService, GenericService, binding, {})).toThrow(
      "Binding descriptor must provide a 'token' property."
    );
  });

  it("should throw for instance descriptor with unknown scope", () => {
    const container: Container = createContainer();
    const binding = {
      type: BindingType.Instance,
      token: GenericService,
      scope: "UNKNOWN",
      value: GenericService,
    } as unknown as InstanceBindingDescriptor;

    expect(() => bindInstanceWithToken(container, GenericService, GenericService, binding, {})).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE })
    );
    expect(() => bindInstanceWithToken(container, GenericService, GenericService, binding, {})).toThrow(
      "Binding descriptor has unknown scope 'UNKNOWN'."
    );
  });

  it("should handle async @OnActivated and catch errors", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = createContainer();

    bindInstance(container, AsyncFailService);

    container.get(AsyncFailService);

    // Need to wait for next tick for the caught promise.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "[wirestate] @OnActivated rejected:",
      {
        source: "instance-activation",
        instanceName: "AsyncFailService",
        methodName: "onActivated",
      },
      "AsyncFailService",
      "onActivated",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should throw on failing @OnActivated methods without failing resolution", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = createContainer();

    bindInstance(container, SyncFailActivationService);

    expect(() => container.get(SyncFailActivationService)).toThrow("sync-activation-fail");

    consoleSpy.mockRestore();
  });

  it("should report sync @OnActivated errors to container error handler before rethrowing", () => {
    const onError = jest.fn();
    const container: Container = createContainer({
      onError,
    });

    bindInstance(container, SyncFailActivationService);

    expect(() => container.get(SyncFailActivationService)).toThrow("sync-activation-fail");
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["SyncFailActivationService", "onActivated"],
        message: "@OnActivated failed",
        instanceName: "SyncFailActivationService",
        source: "instance-activation",
      })
    );
  });

  it("should clean up handlers and scope when @OnActivated throws synchronously", () => {
    const ACTIVATION_FAILURE_EVENT: string = "ACTIVATION_FAILURE_EVENT";
    const ACTIVATION_FAILURE_COMMAND: string = "ACTIVATION_FAILURE_COMMAND";
    const ACTIVATION_FAILURE_QUERY: string = "ACTIVATION_FAILURE_QUERY";

    let eventCalls: number = 0;

    const instanceRef: { current: Optional<object> } = { current: null };
    const scopeRef: { current: Optional<WireScope> } = { current: null };

    @Injectable()
    class SyncFailActivationWithHandlersService {
      public constructor(public readonly scope: WireScope = inject(WireScope)) {
        instanceRef.current = this;
        scopeRef.current = scope;
      }

      @OnActivated()
      public onActivated(): void {
        throw new Error("sync-activation-handlers-fail");
      }

      @OnCommand(ACTIVATION_FAILURE_COMMAND)
      public onCommand(): string {
        return "command-response";
      }

      @OnEvent(ACTIVATION_FAILURE_EVENT)
      public onEvent(): void {
        eventCalls += 1;
      }

      @OnQuery(ACTIVATION_FAILURE_QUERY)
      public onQuery(): string {
        return "query-response";
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });

    bindInstance(container, SyncFailActivationWithHandlersService);

    expect(() => container.get(SyncFailActivationWithHandlersService)).toThrow("sync-activation-handlers-fail");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.get(CommandBus).hasHandler(ACTIVATION_FAILURE_COMMAND)).toBe(false);
    expect(container.get(QueryBus).hasHandler(ACTIVATION_FAILURE_QUERY)).toBe(false);
    expect(container.get(EventBus).hasSubscribers()).toBe(false);
    expect(instanceRef.current).not.toBeNull();
    expect(scopeRef.current).not.toBeNull();

    expect((scopeRef.current as WireScope).resolve(Container)).toBe(container);
    expect(WireStatus.for(instanceRef.current as object)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });

    expect(() => container.get(QueryBus).query(ACTIVATION_FAILURE_QUERY)).toThrow(
      "No query handler registered in container for type: 'ACTIVATION_FAILURE_QUERY'."
    );
    expect(() => container.get(CommandBus).execute(ACTIVATION_FAILURE_COMMAND)).toThrow(
      "No command handler registered in container for type: 'ACTIVATION_FAILURE_COMMAND'."
    );

    container.get(EventBus).emit(ACTIVATION_FAILURE_EVENT);

    expect(eventCalls).toBe(0);
  });

  it("should catch and log failing @OnDeactivation methods while preserving cleanup", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const container: Container = createContainer();

    bindInstance(container, SyncFailDeactivationService);

    const instance: SyncFailDeactivationService = container.get(SyncFailDeactivationService);

    expect(container.get(QueryBus).query("SYNC_FAIL_DEACTIVATION_QUERY")).toBe("query-response");
    expect(() => container.unbind(SyncFailDeactivationService)).not.toThrow();

    expect(instance.scope.resolve(Container)).toBe(container);
    expect(WireStatus.for(instance)).toEqual({
      isDisposed: true,
      isDeprovisioned: true,
      isInactive: true,
      provisionId: null,
    });

    expect(container.get(QueryBus).hasHandler("SYNC_FAIL_DEACTIVATION_QUERY")).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[wirestate] @OnDeactivation failed:",
      {
        source: "instance-deactivation",
        instanceName: "SyncFailDeactivationService",
        methodName: "onDeactivation",
      },
      "SyncFailDeactivationService",
      "onDeactivation",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should report async @OnActivated errors to container error handler", async () => {
    const onError = jest.fn();
    const container: Container = createContainer({
      activate: true,
      bindings: [AsyncFailService],
      onError,
    });

    // Need to wait for next tick for the caught promise.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["AsyncFailService", "onActivated"],
        message: "@OnActivated rejected",
        instanceName: "AsyncFailService",
        source: "instance-activation",
      })
    );
  });

  it("should keep configured error handler available during container cleanup", () => {
    const onError = jest.fn();
    const container: Container = createContainer({
      activate: true,
      bindings: [SyncFailDeactivationService],

      onError,
    });

    expect(() => unbindAll(container)).not.toThrow();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["SyncFailDeactivationService", "onDeactivation"],
        message: "@OnDeactivation failed",
        instanceName: "SyncFailDeactivationService",
        source: "instance-deactivation",
      })
    );
  });

  it("should report decorated event handler errors to container error handler", () => {
    const error = new Error("decorated-event-fail");
    const onError = jest.fn();

    @Injectable()
    class FailingEventService {
      @OnEvent("FAILING_EVENT")
      public onEvent(): void {
        throw error;
      }
    }

    const container: Container = createContainer({
      activate: true,
      bindings: [FailingEventService],
      onError,
    });

    container.get(EventBus).emit("FAILING_EVENT");

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        error,
        event: { type: "FAILING_EVENT" },
        message: "Event handler threw",
        instanceName: "FailingEventService",
        source: "instance-event-handler",
      })
    );
  });

  it("should invoke a multiply-decorated event method only once per event", () => {
    const onEvent = jest.fn();

    @Injectable()
    class MultiDecoratedService {
      @OnEvent("SHARED")
      @OnEvent("SHARED")
      @OnEvent(["SHARED", "OTHER"])
      public onEvent(): void {
        onEvent();
      }
    }

    const container: Container = createContainer({
      activate: true,
      bindings: [MultiDecoratedService],
    });

    const bus: EventBus = container.get(EventBus);

    bus.emit("SHARED");
    expect(onEvent).toHaveBeenCalledTimes(1);

    bus.emit("OTHER");
    expect(onEvent).toHaveBeenCalledTimes(2);

    bus.emit("UNRELATED");
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it("should handle non-function @OnQuery or @OnActivated properties during activation", () => {
    const container: Container = createContainer();

    bindInstance(container, CorruptedService);

    // This should not throw exceptions with corrupted 'activation' handlers.
    const instance: CorruptedService = container.get(CorruptedService);

    expect(instance).toBeDefined();
    expect(() => container.get(QueryBus).query("CORRUPTED_QUERY")).toThrow(
      "No query handler registered in container for type: 'CORRUPTED_QUERY'."
    );
  });
});
