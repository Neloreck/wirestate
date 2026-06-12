import { GenericService } from "@/fixtures/services/generic-service";

import {
  BindingDescriptor,
  BindingScope,
  BindingType,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ValueBindingDescriptor,
} from "../binding/binding";
import { Container } from "../container/container";
import { inject } from "../container/context";
import { WireScope } from "../container/wire-scope";
import { WireStatus } from "../container/wire-status";
import { ERROR_CODE_INVALID_BINDING_SCOPE, ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { OnActivated } from "../lifecycle/on-activated";
import { OnDeactivation } from "../lifecycle/on-deactivation";
import { CommandBus } from "../messaging/commands/command-bus";
import { OnCommand } from "../messaging/commands/on-command";
import { EventBus } from "../messaging/events/event-bus";
import { OnEvent } from "../messaging/events/on-event";
import { OnQuery } from "../messaging/queries/on-query";
import { QueryBus } from "../messaging/queries/query-bus";
import { Injectable } from "../metadata/injectable";
import { AnyObject, Optional } from "../types/general";

describe("container.bind", () => {
  it("should bind a class directly", () => {
    const container: Container = new Container();
    const result: Container = container.bind(GenericService);

    expect(result).toBe(container);
    expect(container.has(GenericService)).toBe(true);
  });

  it("should bind a value descriptor", () => {
    const TOKEN: unique symbol = Symbol("config");

    const container: Container = new Container();
    const result: Container = container.bind({
      token: TOKEN,
      value: { key: "value" },
      type: BindingType.Value,
    });

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a value when type is undefined", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("config");

    container.bind({ token: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a factory descriptor", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("dynamic");

    let callCount: number = 0;

    container.bind({
      token: TOKEN,
      type: BindingType.Factory,
      scope: BindingScope.Transient,
      factory: () => {
        callCount++;

        return { count: callCount };
      },
    });

    expect(container.get(TOKEN)).toEqual({ count: 1 });
    expect(container.get(TOKEN)).toEqual({ count: 2 });
    expect(container.get(TOKEN)).toEqual({ count: 3 });
  });

  it("should bind descriptors with string literal type and scope", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("literal-factory");

    const descriptor: FactoryBindingDescriptor = {
      token: TOKEN,
      type: "Factory",
      scope: "Singleton",
      factory: () => ({ value: "created" }),
    };

    container.bind(descriptor);

    const first = container.get(TOKEN);

    expect(first).toEqual({ value: "created" });
    expect(container.get(TOKEN)).toBe(first);
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
    const container: Container = new Container();
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

  it("should throw for factory descriptor with invalid factory", () => {
    const container: Container = new Container();

    expect(() =>
      container.bind({
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      container.bind({
        type: BindingType.Factory,
        factory: "not-a-function",
        token: "bad-factory",
      } as unknown as FactoryBindingDescriptor)
    ).toThrow("Factory descriptor 'factory' must be a function.");
  });

  describe("instance", () => {
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
      const container: Container = new Container();

      const result: Container = container.bind(GenericService);

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
      const container: Container = new Container({ onError });

      container.bind(SyncFailActivationWithHandlersService);

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

      const container: Container = new Container();

      container.bind(SyncFailDeactivationService);

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

      const container: Container = new Container({
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
      const container: Container = new Container();

      container.bind(CorruptedService);

      // This should not throw exceptions with corrupted 'activation' handlers.
      const instance: CorruptedService = container.get(CorruptedService);

      expect(instance).toBeDefined();
      expect(() => container.get(QueryBus).query("CORRUPTED_QUERY")).toThrow(
        "No query handler registered in container for type: 'CORRUPTED_QUERY'."
      );
    });
  });

  describe("factory", () => {
    it("should bind a factory creator", () => {
      const container: Container = new Container();
      const TOKEN: unique symbol = Symbol("greeting-factory");
      const binding: FactoryBindingDescriptor<() => string> = {
        type: BindingType.Factory,
        factory: () => () => "hello",
        token: TOKEN,
      };

      const result: Container = container.bind(binding);

      const factory: () => string = container.get(TOKEN);

      expect(result).toBe(container);
      expect(factory()).toBe("hello");
      expect(container.getOwnBindings()).toContainEqual(binding);
    });

    it("should call factory once and cache the value by default", () => {
      const container: Container = new Container();
      const value: AnyObject = { c: 3, d: 4 };
      const factory = jest.fn(() => value);

      const result: Container = container.bind({
        type: BindingType.Factory,
        token: "factory-value",
        factory,
      });

      expect(result).toBe(container);
      expect(container.get("factory-value")).toEqual({ c: 3, d: 4 });
      expect(container.get("factory-value")).toBe(value);

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("should pass container to factory", () => {
      const container: Container = new Container();
      const NAME_TOKEN: unique symbol = Symbol("name");
      const GREETING_TOKEN: unique symbol = Symbol("greeting");
      const factory = jest.fn((current: Container) => `Hello, ${current.get<string>(NAME_TOKEN)}`);

      container.bind({ token: NAME_TOKEN, value: "Ada" });

      container.bind({
        type: BindingType.Factory,
        factory,
        token: GREETING_TOKEN,
      });

      expect(container.get(GREETING_TOKEN)).toBe("Hello, Ada");
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("should respect Singleton scope", () => {
      const container: Container = new Container();
      const value: AnyObject = { c: 3, d: 4 };
      const factory = jest.fn(() => value);

      container.bind({
        type: BindingType.Factory,
        token: "factory-singleton",
        factory,
        scope: BindingScope.Singleton,
      });

      expect(container.get("factory-singleton")).toBe(value);
      expect(container.get("factory-singleton")).toBe(value);
      expect(container.get("factory-singleton")).toBe(value);

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("should respect Transient scope", () => {
      const container: Container = new Container();
      let count: number = 0;

      container.bind({
        type: BindingType.Factory,
        token: "factory-transient",
        factory: () => count++,
        scope: BindingScope.Transient,
      });

      expect(container.get("factory-transient")).toBe(0);
      expect(container.get("factory-transient")).toBe(1);
      expect(container.get("factory-transient")).toBe(2);
    });
  });

  describe("value", () => {
    it("should bind a value to the container", () => {
      const container: Container = new Container();
      const binding: ValueBindingDescriptor = { token: "my-token", value: "my-value" };

      const result: Container = container.bind(binding);

      expect(result).toBe(container);
      expect(container.get("my-token")).toBe("my-value");
      expect(container.getOwnBindings()).toContainEqual(binding);
    });
  });
});
