import { Container } from "inversify";

import { bindService } from "@/wirestate/bind/bind-service";
import { CommandBus } from "@/wirestate/commands/command-bus";
import { createIocContainer } from "@/wirestate/container/create-ioc-container";
import { EventBus } from "@/wirestate/events/event-bus";
import { QueryBus } from "@/wirestate/queries/query-bus";
import { EVENT_BUS_TOKEN, QUERY_BUS_TOKEN, COMMAND_BUS_TOKEN, SEEDS_TOKEN, SEED_TOKEN } from "@/wirestate/registry";
import { WireScope } from "@/wirestate/scope/wire-scope";

describe("createIocContainer", () => {
  it("should create a container with default essentials", () => {
    const container: Container = createIocContainer();

    expect(container).toBeInstanceOf(Container);
    expect(container.get(EVENT_BUS_TOKEN)).toBeInstanceOf(EventBus);
    expect(container.get(QUERY_BUS_TOKEN)).toBeInstanceOf(QueryBus);
    expect(container.get(COMMAND_BUS_TOKEN)).toBeInstanceOf(CommandBus);
    expect(container.get(SEEDS_TOKEN)).toBeInstanceOf(Map);
    expect(container.get(SEED_TOKEN)).toEqual({});
    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
  });

  it("should bind core buses as singletons by default", () => {
    const container: Container = createIocContainer();

    expect(container.get(EVENT_BUS_TOKEN)).toBeInstanceOf(EventBus);
    expect(container.get(EVENT_BUS_TOKEN)).toBe(container.get(EVENT_BUS_TOKEN));
    expect(container.get(QUERY_BUS_TOKEN)).toBeInstanceOf(QueryBus);
    expect(container.get(QUERY_BUS_TOKEN)).toBe(container.get(QUERY_BUS_TOKEN));
    expect(container.get(COMMAND_BUS_TOKEN)).toBeInstanceOf(CommandBus);
    expect(container.get(COMMAND_BUS_TOKEN)).toBe(container.get(COMMAND_BUS_TOKEN));
  });

  it("should bind WireScope in transient scope", () => {
    const container: Container = createIocContainer();

    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.get(WireScope)).not.toBe(container.get(WireScope));
  });

  it("should bind WireScope with injected container", () => {
    const container: Container = createIocContainer();

    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.get(WireScope)).not.toBe(container.get(WireScope));
    expect(container.get(WireScope)["container"]).toBe(container);
    expect(container.get(WireScope)["container"]).toBe(container);
    expect(container.get(WireScope).isDisposed).toBe(false);
  });

  it("should respect parent container", () => {
    const parent: Container = new Container();
    const PARENT_TOKEN: unique symbol = Symbol.for("PARENT_TOKEN");

    parent.bind(PARENT_TOKEN).toConstantValue("parent-value");

    const container: Container = createIocContainer({ parent });

    expect(container.get(PARENT_TOKEN)).toBe("parent-value");
  });

  it("should use Singleton as default scope for new bindings", () => {
    const container: Container = createIocContainer();

    class TestService {}

    bindService(container, TestService);

    expect(container.get(TestService)).toBe(container.get(TestService));
  });
});
