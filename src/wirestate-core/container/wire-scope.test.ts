import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { Inject, Injectable } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { ERROR_CODE_ACCESS_AFTER_DISPOSAL, ERROR_CODE_ACCESS_BEFORE_ACTIVATION } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { applySeeds } from "../seeds/apply-seeds";
import { OnActivated } from "../service/on-activated";
import { OnDeactivation } from "../service/on-deactivation";
import { mockContainer } from "../test-utils/mock-container";
import { mockService } from "../test-utils/mock-service";
import { CommandStatus, CommandDescriptor } from "../types/commands";
import { MaybePromise, Optional } from "../types/general";

import { WireScope } from "./wire-scope";

describe("WireScope", () => {
  it("should throw error if accessed before activation", () => {
    const scope: WireScope = new WireScope(null);

    expect(() => scope.getContainer()).toThrow(WirestateError);
    expect(() => scope.getContainer()).toThrow(expect.objectContaining({ code: ERROR_CODE_ACCESS_BEFORE_ACTIVATION }));
  });

  it("should throw error if accessed after disposal", () => {
    const scope: WireScope = new WireScope(null);

    (scope as { isDisposed: boolean }).isDisposed = true;

    expect(() => scope.getContainer()).toThrow(WirestateError);
    expect(() => scope.getContainer()).toThrow(expect.objectContaining({ code: ERROR_CODE_ACCESS_AFTER_DISPOSAL }));
  });

  it("should return container if activated", () => {
    const container: Container = mockContainer();
    const scope: WireScope = new WireScope(container);

    expect(scope.getContainer()).toBe(container);
  });

  it("should resolve from container", () => {
    const container: Container = mockContainer();
    const scope: WireScope = new WireScope(container);

    container.bind("TEST").toConstantValue("VALUE");

    expect(scope.resolve("TEST")).toBe("VALUE");
    expect(() => scope.resolve("NOT_EXISTING")).toThrow(Error);
  });

  it("should resolve optional from container", () => {
    const container: Container = mockContainer();
    const scope: WireScope = new WireScope(container);

    container.bind("TEST").toConstantValue("VALUE");

    expect(scope.resolveOptional("TEST")).toBe("VALUE");
    expect(scope.resolveOptional("NON_EXISTENT")).toBeNull();
  });

  it("should emit events via event bus", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "emit");

    scope.emitEvent("TEST_FIRST_EVENT", { data: 1 });
    scope.emitEvent("TEST_SECOND_EVENT", "string-data", window);

    expect(bus.emit).toHaveBeenCalledTimes(2);
    expect(bus.emit).toHaveBeenCalledWith({
      type: "TEST_FIRST_EVENT",
      payload: { data: 1 },
      from: scope,
    });
    expect(bus.emit).toHaveBeenCalledWith({
      type: "TEST_SECOND_EVENT",
      payload: "string-data",
      from: window,
    });
  });

  it("should subscribe to events via scope", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn();

    jest.spyOn(bus, "subscribe");

    const unsubscribe = scope.subscribeToEvent(handler);

    expect(bus.subscribe).toHaveBeenCalledWith(handler);
    expect(typeof unsubscribe).toBe("function");

    bus.emit({ type: "TEST" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe from events via scope", () => {
    const container: Container = mockContainer();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn();

    jest.spyOn(bus, "unsubscribe");

    scope.subscribeToEvent(handler);
    scope.unsubscribeFromEvent(handler);

    expect(bus.unsubscribe).toHaveBeenCalledWith(handler);

    bus.emit({ type: "TEST" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should query data via query bus", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_QUERY", () => "result-from-bus");

    jest.spyOn(bus, "query");
    jest.spyOn(bus, "queryOptional");

    const result: MaybePromise<string> = scope.queryData("TEST_QUERY", { param: 1 });

    expect(result).toBe("result-from-bus");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", { param: 1 });

    const missing: Optional<unknown> = scope.queryOptionalData("MISSING_QUERY", "string-value");

    expect(missing).toBeNull();
    expect(bus.queryOptional).toHaveBeenCalledWith("MISSING_QUERY", "string-value");
  });

  it("should execute commands via command bus", async () => {
    const container: Container = mockContainer();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    jest.spyOn(bus, "command");

    const result: CommandDescriptor<string> = scope.executeCommand("TEST_COMMAND", "first-attempt");

    expect(result.status).toBe(CommandStatus.PENDING);
    expect(await result.task).toBe("result-from-command-bus");
    expect(result.status).toBe(CommandStatus.SETTLED);
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");

    expect(() => scope.executeCommand("NOT_EXISTING", "second-attempt")).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );

    expect(bus.command).toHaveBeenCalledTimes(2);
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.command).toHaveBeenCalledWith("NOT_EXISTING", "second-attempt");
  });

  it("should execute optional commands via command bus", async () => {
    const container: Container = mockContainer();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "commandOptional");

    const missing: Optional<CommandDescriptor> = scope.executeOptionalCommand("TEST_COMMAND", "first-attempt");

    expect(missing).toBeNull();

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    const result: Optional<CommandDescriptor<string>> = scope.executeOptionalCommand("TEST_COMMAND", "second-attempt");

    expect(result?.status).toBe(CommandStatus.PENDING);
    expect(await result?.task).toBe("result-from-command-bus");
    expect(result?.status).toBe(CommandStatus.SETTLED);

    expect(bus.commandOptional).toHaveBeenCalledTimes(2);
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "second-attempt");
  });

  it("should register query handler via scope", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("result");

    jest.spyOn(bus, "register");

    const unregister = scope.registerQueryHandler("TEST_QUERY", handler);

    expect(bus.register).toHaveBeenCalledWith("TEST_QUERY", handler);
    expect(typeof unregister).toBe("function");
    expect(bus.query("TEST_QUERY")).toBe("result");
  });

  it("should register command handler via scope", async () => {
    const container: Container = mockContainer();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("result");

    jest.spyOn(bus, "register");

    const unregister = scope.registerCommandHandler("TEST_COMMAND", handler);

    expect(bus.register).toHaveBeenCalledWith("TEST_COMMAND", handler);
    expect(typeof unregister).toBe("function");
    expect(await bus.command("TEST_COMMAND").task).toBe("result");
  });

  it("should unregister query handler via scope", () => {
    const container: Container = mockContainer();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("value");

    jest.spyOn(bus, "unregister");

    bus.register("TEST_QUERY", handler);
    scope.unregisterQueryHandler("TEST_QUERY", handler);

    expect(bus.unregister).toHaveBeenCalledWith("TEST_QUERY", handler);
    expect(bus.has("TEST_QUERY")).toBe(false);
  });

  it("should unregister command handler via scope", () => {
    const container: Container = mockContainer();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("value");

    jest.spyOn(bus, "unregister");

    bus.register("TEST_COMMAND", handler);
    scope.unregisterCommandHandler("TEST_COMMAND", handler);

    expect(bus.unregister).toHaveBeenCalledWith("TEST_COMMAND", handler);
    expect(bus.has("TEST_COMMAND")).toBe(false);
  });

  it("should get global seed from container", () => {
    const container: Container = mockContainer({ seed: { key: "val" } });
    const scope: WireScope = new WireScope(container);

    expect(scope.getSeed()).toEqual({ key: "val" });
  });

  it("should get bound seed from container", () => {
    const container: Container = mockContainer();
    const scope: WireScope = new WireScope(container);

    applySeeds(container, [[GenericService, { a: 1, b: 2 }]]);

    expect(scope.getSeed(GenericService)).toEqual({ a: 1, b: 2 });
    expect(scope.getSeed("NOT_EXISTING")).toBeNull();
  });

  it("should support full handler lifecycle: register on activation and unregister on deactivation without throwing", async () => {
    @Injectable()
    class ServiceWithManualSubs {
      public constructor(
        @Inject(WireScope)
        private readonly scope: WireScope
      ) {}

      @OnActivated()
      public onActivated(): void {
        this.scope.subscribeToEvent(this.onEvent);
        this.scope.registerCommandHandler("TEST_COMMAND", this.onCommand);
        this.scope.registerQueryHandler("TEST_QUERY", this.onQuery);
      }

      @OnDeactivation()
      public onDeactivation(): void {
        this.scope.unsubscribeFromEvent(this.onEvent);
        this.scope.unregisterCommandHandler("TEST_COMMAND", this.onCommand);
        this.scope.unregisterQueryHandler("TEST_QUERY", this.onQuery);
      }

      public onEvent = jest.fn(() => void 0);

      public onCommand = jest.fn(() => "command-value");

      public onQuery = jest.fn(() => "query-value");
    }

    const container: Container = mockContainer();
    const eventBus: EventBus = container.get(EventBus);
    const queryBus: QueryBus = container.get(QueryBus);
    const commandBus: CommandBus = container.get(CommandBus);

    expect(eventBus.has()).toBe(false);
    expect(commandBus.has("TEST_COMMAND")).toBe(false);
    expect(queryBus.has("TEST_QUERY")).toBe(false);

    const service: ServiceWithManualSubs = mockService(ServiceWithManualSubs, container);

    expect(eventBus.has()).toBe(true);
    expect(commandBus.has("TEST_COMMAND")).toBe(true);
    expect(queryBus.has("TEST_QUERY")).toBe(true);

    const scope: WireScope = container.get(WireScope);

    scope.emitEvent("TEST_EVENT");
    expect(service.onEvent).toHaveBeenCalledTimes(1);

    expect(scope.queryData("TEST_QUERY")).toBe("query-value");
    expect(service.onQuery).toHaveBeenCalledTimes(1);

    expect(await scope.executeCommand("TEST_COMMAND").task).toBe("command-value");
    expect(service.onCommand).toHaveBeenCalledTimes(1);

    container.unbind(ServiceWithManualSubs);

    expect(eventBus.has()).toBe(false);
    expect(commandBus.has("TEST_COMMAND")).toBe(false);
    expect(queryBus.has("TEST_QUERY")).toBe(false);

    expect(() => scope.emitEvent("TEST_EVENT")).not.toThrow();
    expect(service.onEvent).toHaveBeenCalledTimes(1);

    expect(() => scope.queryData("TEST_QUERY")).toThrow(
      "No query handler registered in container for type: 'TEST_QUERY'."
    );
    expect(service.onQuery).toHaveBeenCalledTimes(1);

    expect(() => scope.executeCommand("TEST_COMMAND")).toThrow(
      "No command handler registered in container for type: 'TEST_COMMAND'."
    );
    expect(service.onCommand).toHaveBeenCalledTimes(1);
  });
});
