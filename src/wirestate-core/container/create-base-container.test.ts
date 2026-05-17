import { Container } from "inversify";

import { bindService } from "../bind/bind-service";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";

import { createBaseContainer } from "./create-base-container";

describe("createBaseContainer", () => {
  it("should create a container with default essentials", () => {
    const container: Container = createBaseContainer({});

    expect(container).toBeInstanceOf(Container);
    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(SEEDS_TOKEN)).toBeInstanceOf(Map);
    expect(container.get(SEED_TOKEN)).toEqual({});
  });

  it("should bind core buses as singletons by default", () => {
    const container: Container = createBaseContainer({});

    expect(container.get(EventBus)).toBe(container.get(EventBus));
    expect(container.get(QueryBus)).toBe(container.get(QueryBus));
    expect(container.get(CommandBus)).toBe(container.get(CommandBus));

    class TestService {}

    bindService(container, TestService);

    expect(container.get(TestService)).toBe(container.get(TestService));
  });

  it("should respect parent container", () => {
    const parent: Container = new Container();
    const PARENT_TOKEN: unique symbol = Symbol.for("PARENT_TOKEN");

    parent.bind(PARENT_TOKEN).toConstantValue("parent-value");

    const container: Container = createBaseContainer({ parent });

    expect(container.get(PARENT_TOKEN)).toBe("parent-value");
  });

  it("should use provided seed", () => {
    const container: Container = createBaseContainer({ seed: { key: "value" } });

    expect(container.get(SEED_TOKEN)).toEqual({ key: "value" });
  });

  it("should use provided seeds", () => {
    const TEST_TOKEN: unique symbol = Symbol.for("TEST_TOKEN");
    const container: Container = createBaseContainer({
      seeds: [[TEST_TOKEN, { data: 123 }]],
    });

    const seedsMap: Map<unknown, unknown> = container.get(SEEDS_TOKEN);

    expect(seedsMap.get(TEST_TOKEN)).toEqual({ data: 123 });
  });
});
