import { Container } from "inversify";

import { Injectable } from "../alias";
import { bindService } from "../bind/bind-service";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";

import { createContainer } from "./create-container";
import { WireScope } from "./wire-scope";

describe("createContainer", () => {
  it("should create a container with default essentials", () => {
    const container: Container = createContainer();

    expect(container).toBeInstanceOf(Container);
    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(SEEDS_TOKEN)).toBeInstanceOf(Map);
    expect(container.get(SEED_TOKEN)).toEqual({});
    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
  });

  it("should bind core buses as singletons by default", () => {
    const container: Container = createContainer();

    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(EventBus)).toBe(container.get(EventBus));
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(QueryBus)).toBe(container.get(QueryBus));
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(CommandBus)).toBe(container.get(CommandBus));
  });

  it("should bind WireScope in transient scope", () => {
    const container: Container = createContainer();

    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.get(WireScope)).not.toBe(container.get(WireScope));
  });

  it("should bind WireScope with injected container", () => {
    const container: Container = createContainer();

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

    const container: Container = createContainer({ parent });

    expect(container.get(PARENT_TOKEN)).toBe("parent-value");
  });

  it("should use Singleton as default scope for new bindings", () => {
    const container: Container = createContainer();

    class TestService {}

    bindService(container, TestService);

    expect(container.get(TestService)).toBe(container.get(TestService));
  });

  it("should use provided seed", () => {
    const container: Container = createContainer({ seed: { key: "value" } });

    expect(container.get(SEED_TOKEN)).toEqual({ key: "value" });
  });

  it("should use provided seeds", () => {
    const TEST_TOKEN: unique symbol = Symbol.for("TEST_TOKEN");
    const container: Container = createContainer({
      seeds: [[TEST_TOKEN, { data: 123 }]],
    });

    const seedsMap: Map<unknown, unknown> = container.get(SEEDS_TOKEN);

    expect(seedsMap.get(TEST_TOKEN)).toEqual({ data: 123 });
  });

  it("should bind provided entries", () => {
    class TestService {}
    const container: Container = createContainer({
      entries: [TestService],
    });

    expect(container.get(TestService)).toBeInstanceOf(TestService);
  });

  it("should activate provided services", () => {
    let activated: boolean = false;

    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    createContainer({
      entries: [TestService],
      activate: [TestService],
    });

    expect(activated).toBe(true);
  });

  it("should throw error if activate is provided without entries", () => {
    expect(() =>
      createContainer({
        activate: ["SomeService"],
      })
    ).toThrow("Supplied activation list while entries for binding are not provided.");
  });

  it("should throw error if activated service is not in entries", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      createContainer({
        entries: [TestService],
        activate: ["OtherService"],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");
  });
});
