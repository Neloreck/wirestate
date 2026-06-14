import { GenericService } from "@/fixtures/services/generic-service";

import { OnActivated } from "../activation/on-activated";
import { OnDeactivation } from "../activation/on-deactivation";
import { WireStatus } from "../activation/wire-status";
import {
  BindingDescriptor,
  BindingType,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
} from "../binding/binding";
import { Container } from "../container/container";
import { inject } from "../container/container-context";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { CommandBus } from "../plugin/commands/command-bus";
import { CommandsPlugin } from "../plugin/commands/commands-plugin";
import { OnCommand } from "../plugin/commands/on-command";
import { EventBus } from "../plugin/events/event-bus";
import { EventsPlugin } from "../plugin/events/events-plugin";
import { OnEvent } from "../plugin/events/on-event";
import { OnQuery } from "../plugin/queries/on-query";
import { QueriesPlugin } from "../plugin/queries/queries-plugin";
import { QueryBus } from "../plugin/queries/query-bus";
import { Nullable } from "../types/general";

describe("container.bind instance", () => {
  it("should bind a class directly", () => {
    const container: Container = new Container();
    const result: Container = container.bind(GenericService);

    expect(result).toBe(container);
    expect(container.has(GenericService)).toBe(true);
  });

  it("should bind an instance descriptor", () => {
    const container: Container = new Container();

    container.bind({
      type: BindingType.Instance,
      token: GenericService,
      value: GenericService,
    });

    expect(container.has(GenericService)).toBe(true);
  });

  it("should bind an instance descriptor to its descriptor token", () => {
    const container: Container = new Container({
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
    });
    const TOKEN: unique symbol = Symbol("token");
    const binding: BindingDescriptor = {
      type: BindingType.Instance,
      token: TOKEN,
      value: GenericService,
    };

    container.bind(binding);

    expect(container.has(TOKEN)).toBe(true);
    expect(container.get(TOKEN)).toBeInstanceOf(GenericService);
    expect(container.getOwnBindings()).toContainEqual(binding);
  });

  // Shared descriptor-validation cases. These guard the generic `bind()` argument
  // checks; they live with the instance suite rather than in their own file.
  describe("descriptor validation", () => {
    it("should throw for instance descriptor without token", () => {
      const container: Container = new Container();
      const binding = {
        type: BindingType.Instance,
        value: GenericService,
      } as unknown as InstanceBindingDescriptor;

      expect(() => container.bind(binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
      expect(() => container.bind(binding)).toThrow("Binding descriptor must provide a 'token' property.");
    });

    it("should throw for instance descriptor with unknown scope", () => {
      const container: Container = new Container();
      const binding = {
        type: BindingType.Instance,
        token: GenericService,
        scope: "UNKNOWN",
        value: GenericService,
      } as unknown as BindingDescriptor;

      expect(() => container.bind(binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
      expect(() => container.bind(binding)).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
    });

    it("should throw for unknown type", () => {
      const container: Container = new Container();
      const binding = {
        type: "UNKNOWN",
        token: GenericService,
        value: GenericService,
      } as unknown as BindingDescriptor;

      expect(() => container.bind(binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
      expect(() => container.bind(binding)).toThrow("Binding descriptor has unknown type 'UNKNOWN'.");
    });

    it("should throw for removed ServiceRedirection type", () => {
      const container: Container = new Container();
      const binding = {
        type: "ServiceRedirection",
        token: "redirected",
        service: GenericService,
      } as unknown as BindingDescriptor;

      expect(() => container.bind(binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
      expect(() => container.bind(binding)).toThrow("Binding descriptor has unknown type 'ServiceRedirection'.");
    });

    it("should throw for missing descriptor token", () => {
      const container: Container = new Container();
      const binding = { value: "my-value" } as unknown as BindingDescriptor;

      expect(() => container.bind(binding)).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
      expect(() => container.bind(binding)).toThrow("Binding descriptor must provide a 'token' property.");
    });

    it("should throw for unknown scope", () => {
      const container: Container = new Container();

      expect(() =>
        container.bind({
          token: "bad-scope",
          scope: "UNKNOWN",
          value: "my-value",
        } as unknown as BindingDescriptor)
      ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
      expect(() =>
        container.bind({
          token: "bad-scope",
          scope: "UNKNOWN",
          value: "my-value",
        } as unknown as BindingDescriptor)
      ).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
    });

    it("should throw for descriptors without value or factory", () => {
      const container: Container = new Container();

      expect(() =>
        container.bind({
          token: "missing-value",
        } as BindingDescriptor)
      ).toThrow("Value descriptor must provide a 'value' property.");

      expect(() =>
        container.bind({
          type: BindingType.Factory,
          token: "missing-factory",
        } as FactoryBindingDescriptor)
      ).toThrow("Factory descriptor 'factory' must be a function.");
    });
  });

  describe("activation lifecycle", () => {
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
      public constructor(public readonly container: Container = inject(Container)) {}

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
      const container: Container = new Container({
        plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
      });

      expect(container.bind(GenericService)).toBe(container);
      expect(container.provision()).toBe(container);
      expect(container.has(GenericService)).toBe(true);

      const instance: GenericService = container.get(GenericService);

      expect(instance.isActivated).toBe(true);
      expect(WireStatus.for(instance)).toEqual({
        isDeactivated: false,
        isDeprovisioned: false,
        isInactive: false,
        provisionId: 1,
      });

      // Test event from external source.
      container.get(EventBus).emit("TEST_STRING_EVENT", "string-event-data");
      expect(instance.isTestStringEventReceived).toBe(true);
      expect(instance.testStingEventPayload).toBe("string-event-data");

      // Test query from external source.
      expect(container.get(QueryBus).query("TEST_STRING_QUERY")).toBe("string-query-response");

      // Test command from external source.
      expect(container.get(CommandBus).execute("TEST_SYNC_COMMAND", 800)).toBe(1800);

      // Test deactivation. Unbind deprovisions (unsubscribing handlers) before
      // deactivating, so the provision id set above survives onto the status.
      container.unbind(GenericService);

      expect(instance.isActivated).toBe(false);
      expect(instance.container.get(Container)).toBe(container);
      expect(WireStatus.for(instance)).toEqual({
        isDeactivated: true,
        isDeprovisioned: true,
        isInactive: true,
        provisionId: 1,
      });

      // Verify query handler is removed
      expect(() => container.get(QueryBus).query("TEST_QUERY")).toThrow();
    });

    it("should throw for instance descriptor without constructor value", () => {
      const container: Container = new Container();
      const binding = {
        type: BindingType.Instance,
        token: GenericService,
        value: "not-a-constructor",
      } as unknown as InstanceBindingDescriptor;

      expect(() => container.bind(binding as never)).toThrow(
        expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
      );
      expect(() => container.bind(binding as never)).toThrow("Instance descriptor 'value' must be a constructor.");
    });

    it("should throw for instance descriptor without token", () => {
      const container: Container = new Container();
      const binding = {
        type: BindingType.Instance,
        value: GenericService,
      } as unknown as InstanceBindingDescriptor;

      expect(() => container.bind(binding as never)).toThrow(
        expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
      );
      expect(() => container.bind(binding as never)).toThrow("Binding descriptor must provide a 'token' property.");
    });

    it("should throw for instance descriptor with unknown scope", () => {
      const container: Container = new Container();
      const binding = {
        type: BindingType.Instance,
        token: GenericService,
        scope: "UNKNOWN",
        value: GenericService,
      } as unknown as InstanceBindingDescriptor;

      expect(() => container.bind(binding as never)).toThrow(
        expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE })
      );
      expect(() => container.bind(binding as never)).toThrow("Binding descriptor has unknown scope 'UNKNOWN'.");
    });

    it("should handle async @OnActivated and catch errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const container: Container = new Container();

      container.bind(AsyncFailService);

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

      const container: Container = new Container();

      container.bind(SyncFailActivationService);

      expect(() => container.get(SyncFailActivationService)).toThrow("sync-activation-fail");

      consoleSpy.mockRestore();
    });

    it("should report sync @OnActivated errors to container error handler before rethrowing", () => {
      const onError = jest.fn();
      const container: Container = new Container({
        onError,
      });

      container.bind(SyncFailActivationService);

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

    it("should clean up handlers and container tracking when @OnActivated throws synchronously", () => {
      const ACTIVATION_FAILURE_EVENT: string = "ACTIVATION_FAILURE_EVENT";
      const ACTIVATION_FAILURE_COMMAND: string = "ACTIVATION_FAILURE_COMMAND";
      const ACTIVATION_FAILURE_QUERY: string = "ACTIVATION_FAILURE_QUERY";

      let eventCalls: number = 0;

      const instanceRef: { current: Nullable<object> } = { current: null };
      const containerRef: { current: Nullable<Container> } = { current: null };

      @Injectable()
      class SyncFailActivationWithHandlersService {
        public constructor(public readonly container: Container = inject(Container)) {
          instanceRef.current = this;
          containerRef.current = container;
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
      const container: Container = new Container({
        onError,
        plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
      });

      container.bind(SyncFailActivationWithHandlersService);

      expect(() => container.get(SyncFailActivationWithHandlersService)).toThrow("sync-activation-handlers-fail");
      expect(onError).toHaveBeenCalledTimes(1);
      expect(container.get(CommandBus).hasHandler(ACTIVATION_FAILURE_COMMAND)).toBe(false);
      expect(container.get(QueryBus).hasHandler(ACTIVATION_FAILURE_QUERY)).toBe(false);
      expect(container.get(EventBus).hasSubscribers()).toBe(false);
      expect(instanceRef.current).not.toBeNull();
      expect(containerRef.current).not.toBeNull();

      expect((containerRef.current as Container).get(Container)).toBe(container);
      expect(WireStatus.for(instanceRef.current as object)).toEqual({
        isDeactivated: true,
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

      const container: Container = new Container({
        bindings: [SyncFailDeactivationService],
        plugins: [new QueriesPlugin()],
      }).provision();
      const instance: SyncFailDeactivationService = container.get(SyncFailDeactivationService);

      expect(container.get(QueryBus).query("SYNC_FAIL_DEACTIVATION_QUERY")).toBe("query-response");
      expect(() => container.unbind(SyncFailDeactivationService)).not.toThrow();

      expect(instance.container.get(Container)).toBe(container);
      expect(WireStatus.for(instance)).toEqual({
        isDeactivated: true,
        isDeprovisioned: true,
        isInactive: true,
        provisionId: 1,
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
      const container: Container = new Container({
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
      const container: Container = new Container({
        activate: true,
        bindings: [SyncFailDeactivationService],
        plugins: [new QueriesPlugin()],
        onError,
      });

      expect(() => container.unbindAll()).not.toThrow();
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

      const container: Container = new Container({
        activate: true,
        bindings: [FailingEventService],
        plugins: [new EventsPlugin()],
        onError,
      }).provision();

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

      const container: Container = new Container({
        activate: true,
        bindings: [MultiDecoratedService],
        plugins: [new EventsPlugin()],
      }).provision();

      const bus: EventBus = container.get(EventBus);

      bus.emit("SHARED");
      expect(onEvent).toHaveBeenCalledTimes(1);

      bus.emit("OTHER");
      expect(onEvent).toHaveBeenCalledTimes(2);

      bus.emit("UNRELATED");
      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it("should handle non-function @OnQuery or @OnActivated properties during activation", () => {
      const container: Container = new Container({ plugins: [new QueriesPlugin()] });

      container.bind(CorruptedService);

      // This should not throw exceptions with corrupted 'activation' handlers.
      const instance: CorruptedService = container.get(CorruptedService);

      expect(instance).toBeDefined();
      expect(() => container.get(QueryBus).query("CORRUPTED_QUERY")).toThrow(
        "No query handler registered in container for type: 'CORRUPTED_QUERY'."
      );
    });
  });
});
