import { Container } from "inversify";

import { bindService } from "@/wirestate-core/bind/bind-service";
import { CommandBus } from "@/wirestate-core/commands/command-bus";
import { createIocContainer } from "@/wirestate-core/container/create-ioc-container";
import { WireScope } from "@/wirestate-core/container/wire-scope";
import { EventBus } from "@/wirestate-core/events/event-bus";
import { QueryBus } from "@/wirestate-core/queries/query-bus";
import { SEEDS_TOKEN, SEED_TOKEN } from "@/wirestate-core/registry";

describe("createIocContainer", () => {
  it("should create a container with default essentials", () => {
    const container: Container = createIocContainer();

    expect(container).toBeInstanceOf(Container);
    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(SEEDS_TOKEN)).toBeInstanceOf(Map);
    expect(container.get(SEED_TOKEN)).toEqual({});
    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
  });

  it("should bind core buses as singletons by default", () => {
    const container: Container = createIocContainer();

    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(EventBus)).toBe(container.get(EventBus));
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(QueryBus)).toBe(container.get(QueryBus));
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(CommandBus)).toBe(container.get(CommandBus));
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
