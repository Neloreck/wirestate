import { OnActivated } from "../activation/on-activated";
import { OnDeactivation } from "../activation/on-deactivation";
import { Container } from "../container/container";
import { inject } from "../container/container-context";
import { CommandBus } from "../messaging/commands/command-bus";
import { EventBus } from "../messaging/events/event-bus";
import { QueryBus } from "../messaging/queries/query-bus";
import { Injectable } from "../metadata/metadata-injectable";
import { Optional } from "../types/general";

import { WireScope } from "./wire-scope";

describe("WireScope", () => {
  it("should resolve container if activated", () => {
    const container: Container = new Container();
    const scope: WireScope = new WireScope(container);

    expect(scope.get(Container)).toBe(container);
  });

  it("should resolve from container", () => {
    const container: Container = new Container();
    const scope: WireScope = new WireScope(container);

    container.bind({ token: "TEST", value: "VALUE" });

    expect(scope.get("TEST")).toBe("VALUE");
    expect(() => scope.get("NOT_EXISTING")).toThrow(Error);
  });

  it("should resolve optional from container", () => {
    const container: Container = new Container();
    const scope: WireScope = new WireScope(container);

    container.bind({ token: "TEST", value: "VALUE" });

    expect(scope.getOptional("TEST")).toBe("VALUE");
    expect(scope.getOptional("NON_EXISTENT")).toBeNull();
  });

  it("should emit events via event bus", () => {
    const container: Container = new Container();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "emit");

    scope.emitEvent("TEST_FIRST_EVENT", { data: 1 });
    scope.emitEvent("TEST_SECOND_EVENT", "string-data", { source: window });

    expect(bus.emit).toHaveBeenCalledTimes(2);
    expect(bus.emit).toHaveBeenCalledWith("TEST_FIRST_EVENT", { data: 1 }, undefined);
    expect(bus.emit).toHaveBeenCalledWith("TEST_SECOND_EVENT", "string-data", { source: window });
  });

  it("should subscribe to events via scope", () => {
    const container: Container = new Container();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn();

    jest.spyOn(bus, "subscribe");

    const unsubscribe = scope.subscribeToEvent(handler);

    expect(bus.subscribe).toHaveBeenCalledWith(handler);
    expect(typeof unsubscribe).toBe("function");

    bus.emit("TEST");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should subscribe to specific event types via scope", () => {
    const container: Container = new Container();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn();

    jest.spyOn(bus, "subscribe");

    const unsubscribe = scope.subscribeToEvent(["FIRST", "SECOND"], handler);

    expect(bus.subscribe).toHaveBeenCalledWith(["FIRST", "SECOND"], handler);
    expect(typeof unsubscribe).toBe("function");

    bus.emit("FIRST");
    bus.emit("SECOND");
    bus.emit("THIRD");

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith({ type: "FIRST" });
    expect(handler).toHaveBeenCalledWith({ type: "SECOND" });
  });

  it("should unsubscribe from events via scope", () => {
    const container: Container = new Container();
    const bus: EventBus = container.get(EventBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn();

    jest.spyOn(bus, "unsubscribe");

    scope.subscribeToEvent(handler);
    scope.unsubscribeFromEvent(handler);

    expect(bus.unsubscribe).toHaveBeenCalledWith(handler);

    bus.emit("TEST");
    expect(handler).not.toHaveBeenCalled();
  });

  it("should query via query bus", () => {
    const container: Container = new Container();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_QUERY", () => "result-from-bus");

    jest.spyOn(bus, "query");
    jest.spyOn(bus, "queryOptional");

    const result: string = scope.query("TEST_QUERY", { param: 1 });

    expect(result).toBe("result-from-bus");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", { param: 1 });

    const missing: Optional<unknown> = scope.queryOptional("MISSING_QUERY", "string-value");

    expect(missing).toBeNull();
    expect(bus.queryOptional).toHaveBeenCalledWith("MISSING_QUERY", "string-value");
  });

  it("should query async via query bus", async () => {
    const container: Container = new Container();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_SYNC_QUERY", () => "result-from-bus-1");
    bus.register("TEST_ASYNC_QUERY", async () => "result-from-bus-2");

    jest.spyOn(bus, "queryAsync");
    jest.spyOn(bus, "queryOptionalAsync");

    await expect(scope.queryAsync("TEST_SYNC_QUERY", { param: 100 })).resolves.toBe("result-from-bus-1");
    expect(bus.queryAsync).toHaveBeenCalledWith("TEST_SYNC_QUERY", { param: 100 });

    await expect(scope.queryAsync("TEST_ASYNC_QUERY", { param: 1000 })).resolves.toBe("result-from-bus-2");
    expect(bus.queryAsync).toHaveBeenCalledWith("TEST_ASYNC_QUERY", { param: 1000 });

    await expect(scope.queryOptionalAsync("MISSING_QUERY", "string-value")).resolves.toBeNull();
    expect(bus.queryOptionalAsync).toHaveBeenCalledWith("MISSING_QUERY", "string-value");
  });

  it("should execute commands via command bus", () => {
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    jest.spyOn(bus, "execute");

    const result: string = scope.execute("TEST_COMMAND", "first-attempt");

    expect(result).toBe("result-from-command-bus");
    expect(bus.execute).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");

    expect(() => scope.execute("NOT_EXISTING", "second-attempt")).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );

    expect(bus.execute).toHaveBeenCalledTimes(2);
    expect(bus.execute).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.execute).toHaveBeenCalledWith("NOT_EXISTING", "second-attempt");
  });

  it("should execute async commands via command bus", async () => {
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_SYNC_COMMAND", () => "result-from-sync-command");
    bus.register("TEST_ASYNC_COMMAND", async () => "result-from-async-command");

    jest.spyOn(bus, "executeAsync");

    await expect(scope.executeAsync("TEST_SYNC_COMMAND", { param: 100 })).resolves.toBe("result-from-sync-command");
    expect(bus.executeAsync).toHaveBeenCalledWith("TEST_SYNC_COMMAND", { param: 100 });

    await expect(scope.executeAsync("TEST_ASYNC_COMMAND", { param: 1000 })).resolves.toBe("result-from-async-command");
    expect(bus.executeAsync).toHaveBeenCalledWith("TEST_ASYNC_COMMAND", { param: 1000 });

    await expect(scope.executeAsync("NOT_EXISTING", "second-attempt")).rejects.toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });

  it("should execute optional commands via command bus", () => {
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "executeOptional");

    const missing: Optional<unknown> = scope.executeOptional("TEST_COMMAND", "first-attempt");

    expect(missing).toBeNull();

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    const result: Optional<string> = scope.executeOptional("TEST_COMMAND", "second-attempt");

    expect(result).toBe("result-from-command-bus");

    expect(bus.executeOptional).toHaveBeenCalledTimes(2);
    expect(bus.executeOptional).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.executeOptional).toHaveBeenCalledWith("TEST_COMMAND", "second-attempt");
  });

  it("should execute optional async commands via command bus", async () => {
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_COMMAND", async () => "result-from-command-bus");

    jest.spyOn(bus, "executeOptionalAsync");

    await expect(scope.executeOptionalAsync("MISSING_COMMAND", "first-attempt")).resolves.toBeNull();
    await expect(scope.executeOptionalAsync("TEST_COMMAND", "second-attempt")).resolves.toBe("result-from-command-bus");

    expect(bus.executeOptionalAsync).toHaveBeenCalledTimes(2);
    expect(bus.executeOptionalAsync).toHaveBeenCalledWith("MISSING_COMMAND", "first-attempt");
    expect(bus.executeOptionalAsync).toHaveBeenCalledWith("TEST_COMMAND", "second-attempt");
  });

  it("should inject core buses during construction", () => {
    const container: Container = new Container();
    const eventBus: EventBus = container.get(EventBus);
    const queryBus: QueryBus = container.get(QueryBus);
    const commandBus: CommandBus = container.get(CommandBus);

    eventBus.subscribe(() => void 0);
    queryBus.register("TEST_QUERY", (value: number) => value + 1);
    commandBus.register("TEST_COMMAND", (value: number) => value + 1);

    const getSpy = jest.spyOn(container, "get");
    const scope: WireScope = new WireScope(container);

    scope.emitEvent("TEST_EVENT", 1);
    scope.emitEvent("TEST_EVENT", 2);

    expect(scope.query("TEST_QUERY", 1)).toBe(2);
    expect(scope.query("TEST_QUERY", 2)).toBe(3);

    expect(scope.execute("TEST_COMMAND", 1)).toBe(2);
    expect(scope.execute("TEST_COMMAND", 2)).toBe(3);

    expect(getSpy.mock.calls.filter(([token]) => token === EventBus)).toHaveLength(1);
    expect(getSpy.mock.calls.filter(([token]) => token === QueryBus)).toHaveLength(1);
    expect(getSpy.mock.calls.filter(([token]) => token === CommandBus)).toHaveLength(1);
  });

  it("should register query handler via scope", () => {
    const container: Container = new Container();
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
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("result");

    jest.spyOn(bus, "register");

    const unregister = scope.registerCommandHandler("TEST_COMMAND", handler);

    expect(bus.register).toHaveBeenCalledWith("TEST_COMMAND", handler);
    expect(typeof unregister).toBe("function");
    expect(bus.execute("TEST_COMMAND")).toBe("result");
  });

  it("should unregister query handler via scope", () => {
    const container: Container = new Container();
    const bus: QueryBus = container.get(QueryBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("value");

    jest.spyOn(bus, "unregister");

    bus.register("TEST_QUERY", handler);
    scope.unregisterQueryHandler("TEST_QUERY", handler);

    expect(bus.unregister).toHaveBeenCalledWith("TEST_QUERY", handler);
    expect(bus.hasHandler("TEST_QUERY")).toBe(false);
  });

  it("should unregister command handler via scope", () => {
    const container: Container = new Container();
    const bus: CommandBus = container.get(CommandBus);
    const scope: WireScope = new WireScope(container);
    const handler = jest.fn().mockReturnValue("value");

    jest.spyOn(bus, "unregister");

    bus.register("TEST_COMMAND", handler);
    scope.unregisterCommandHandler("TEST_COMMAND", handler);

    expect(bus.unregister).toHaveBeenCalledWith("TEST_COMMAND", handler);
    expect(bus.hasHandler("TEST_COMMAND")).toBe(false);
  });

  it("should support full handler lifecycle: register on activation and unregister on deactivation without throwing", async () => {
    @Injectable()
    class ServiceWithManualSubs {
      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

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

    const container: Container = new Container();
    const eventBus: EventBus = container.get(EventBus);
    const queryBus: QueryBus = container.get(QueryBus);
    const commandBus: CommandBus = container.get(CommandBus);

    expect(eventBus.hasSubscribers()).toBe(false);
    expect(commandBus.hasHandler("TEST_COMMAND")).toBe(false);
    expect(queryBus.hasHandler("TEST_QUERY")).toBe(false);

    const service: ServiceWithManualSubs = container.bind(ServiceWithManualSubs).get(ServiceWithManualSubs);

    expect(eventBus.hasSubscribers()).toBe(true);
    expect(commandBus.hasHandler("TEST_COMMAND")).toBe(true);
    expect(queryBus.hasHandler("TEST_QUERY")).toBe(true);

    const scope: WireScope = container.get(WireScope);

    scope.emitEvent("TEST_EVENT");
    expect(service.onEvent).toHaveBeenCalledTimes(1);

    expect(scope.query("TEST_QUERY")).toBe("query-value");
    expect(service.onQuery).toHaveBeenCalledTimes(1);

    expect(scope.execute("TEST_COMMAND")).toBe("command-value");
    expect(service.onCommand).toHaveBeenCalledTimes(1);

    container.unbind(ServiceWithManualSubs);

    expect(eventBus.hasSubscribers()).toBe(false);
    expect(commandBus.hasHandler("TEST_COMMAND")).toBe(false);
    expect(queryBus.hasHandler("TEST_QUERY")).toBe(false);

    expect(() => scope.emitEvent("TEST_EVENT")).not.toThrow();
    expect(service.onEvent).toHaveBeenCalledTimes(1);

    expect(() => scope.query("TEST_QUERY")).toThrow("No query handler registered in container for type: 'TEST_QUERY'.");
    expect(service.onQuery).toHaveBeenCalledTimes(1);

    expect(() => scope.execute("TEST_COMMAND")).toThrow(
      "No command handler registered in container for type: 'TEST_COMMAND'."
    );
    expect(service.onCommand).toHaveBeenCalledTimes(1);
  });
});
