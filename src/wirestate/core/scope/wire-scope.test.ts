import { Container } from "inversify";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import {
  ERROR_CODE_ACCESS_AFTER_DISPOSAL,
  ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
} from "@/wirestate/core/error/error-code";
import { WirestateError } from "@/wirestate/core/error/wirestate-error";
import { EventBus } from "@/wirestate/core/events/event-bus";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { EVENT_BUS_TOKEN, QUERY_BUS_TOKEN, COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import { WireScope } from "@/wirestate/core/scope/wire-scope";
import { ECommandStatus, ICommandDescriptor } from "@/wirestate/types/commands";
import { MaybePromise, Optional } from "@/wirestate/types/general";

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
    const container: Container = createIocContainer();
    const scope: WireScope = new WireScope(container);

    expect(scope.getContainer()).toBe(container);
  });

  it("should resolve from container", () => {
    const container: Container = createIocContainer();
    const scope: WireScope = new WireScope(container);

    container.bind("TEST").toConstantValue("VALUE");

    expect(scope.resolve("TEST")).toBe("VALUE");
    expect(() => scope.resolve("NOT_EXISTING")).toThrow(Error);
  });

  it("should resolve optional from container", () => {
    const container: Container = createIocContainer();
    const scope: WireScope = new WireScope(container);

    container.bind("TEST").toConstantValue("VALUE");

    expect(scope.resolveOptional("TEST")).toBe("VALUE");
    expect(scope.resolveOptional("NON_EXISTENT")).toBeNull();
  });

  it("should emit events via event bus", () => {
    const container: Container = createIocContainer();
    const bus: EventBus = container.get(EVENT_BUS_TOKEN);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "emit");

    scope.emitEvent("TEST_EVENT", { data: 1 });

    expect(bus.emit).toHaveBeenCalledWith({
      type: "TEST_EVENT",
      payload: { data: 1 },
      from: scope,
    });
  });

  it("should query data via query bus", () => {
    const container: Container = createIocContainer();
    const bus: QueryBus = container.get(QUERY_BUS_TOKEN);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_QUERY", () => "result-from-bus");

    jest.spyOn(bus, "query");

    const result: MaybePromise<string> = scope.queryData("TEST_QUERY", { param: 1 });

    expect(result).toBe("result-from-bus");
    expect(bus.query).toHaveBeenCalledWith("TEST_QUERY", { param: 1 });
  });

  it("should execute commands via command bus", async () => {
    const container: Container = createIocContainer();
    const bus: CommandBus = container.get(COMMAND_BUS_TOKEN);
    const scope: WireScope = new WireScope(container);

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    jest.spyOn(bus, "command");

    const result: ICommandDescriptor<string> = scope.executeCommand("TEST_COMMAND", "first-attempt");

    expect(result.status).toBe(ECommandStatus.PENDING);
    expect(await result.task).toBe("result-from-command-bus");
    expect(result.status).toBe(ECommandStatus.SETTLED);
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");

    expect(() => scope.executeCommand("NOT_EXISTING", "second-attempt")).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );

    expect(bus.command).toHaveBeenCalledTimes(2);
    expect(bus.command).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.command).toHaveBeenCalledWith("NOT_EXISTING", "second-attempt");
  });

  it("should execute optional commands via command bus", async () => {
    const container: Container = createIocContainer();
    const bus: CommandBus = container.get(COMMAND_BUS_TOKEN);
    const scope: WireScope = new WireScope(container);

    jest.spyOn(bus, "commandOptional");

    const missing: Optional<ICommandDescriptor> = scope.executeOptionalCommand("TEST_COMMAND", "first-attempt");

    expect(missing).toBeNull();

    bus.register("TEST_COMMAND", () => "result-from-command-bus");

    const result: Optional<ICommandDescriptor<string>> = scope.executeOptionalCommand("TEST_COMMAND", "second-attempt");

    expect(result?.status).toBe(ECommandStatus.PENDING);
    expect(await result?.task).toBe("result-from-command-bus");
    expect(result?.status).toBe(ECommandStatus.SETTLED);

    expect(bus.commandOptional).toHaveBeenCalledTimes(2);
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "first-attempt");
    expect(bus.commandOptional).toHaveBeenCalledWith("TEST_COMMAND", "second-attempt");
  });

  it("should get seed from container", () => {
    const container: Container = createIocContainer({ seed: { key: "val" } });
    const scope: WireScope = new WireScope(container);

    expect(scope.getSeed()).toEqual({ key: "val" });
  });
});
