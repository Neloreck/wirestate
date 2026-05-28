import { BindingType, Container, Injectable } from "../alias";
import { bindService } from "../bind/bind-service";
import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../seeds/tokens";

import { createContainer } from "./create-container";
import { CONTAINER_PARENT_TOKEN } from "./tokens";
import { WireScope } from "./wire-scope";

describe("createContainer", () => {
  it("should create a container with default essentials", () => {
    const container: Container = createContainer();

    expect(container).toBeInstanceOf(Container);
    expect(container.get(Container)).toBe(container);
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

    expect(container.get(CONTAINER_PARENT_TOKEN)).toBe(parent);
    expect(container.get(PARENT_TOKEN)).toBe("parent-value");
  });

  it("should isolate Wirestate essentials from a Wirestate parent container", () => {
    const parent: Container = createContainer();
    const container: Container = createContainer({ parent });

    expect(container.get(EventBus)).not.toBe(parent.get(EventBus));
    expect(container.get(QueryBus)).not.toBe(parent.get(QueryBus));
    expect(container.get(CommandBus)).not.toBe(parent.get(CommandBus));

    expect(container.get(SEEDS_TOKEN)).not.toBe(parent.get(SEEDS_TOKEN));
    expect(container.get(SEEDS_TOKEN)).toEqual(parent.get(SEEDS_TOKEN));
    expect(container.get(SEED_TOKEN)).not.toBe(parent.get(SEED_TOKEN));
    expect(container.get(SEED_TOKEN)).toEqual(parent.get(SEED_TOKEN));
  });

  it("should resolve parent seed bindings when a parent container is provided", () => {
    const TEST_TOKEN: unique symbol = Symbol.for("TEST_TOKEN");

    const parent: Container = createContainer({
      seed: { source: "parent" },
      seeds: [[TEST_TOKEN, { source: "parent-token" }]],
    });

    const container: Container = createContainer({
      parent,
      seed: { source: "child" },
      seeds: [[TEST_TOKEN, { source: "child-token" }]],
    });

    expect(parent.get(SEED_TOKEN)).toEqual({ source: "parent" });
    expect(parent.get<Map<unknown, unknown>>(SEEDS_TOKEN).get(TEST_TOKEN)).toEqual({ source: "parent-token" });

    expect(container.get(SEED_TOKEN)).toEqual({ source: "child" });
    expect(container.get<Map<unknown, unknown>>(SEEDS_TOKEN).get(TEST_TOKEN)).toEqual({ source: "child-token" });
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

  it("should preserve falsy targeted seed values", () => {
    const container: Container = createContainer({
      seeds: [
        ["FALSE_SEED", false],
        ["ZERO_SEED", 0],
        ["EMPTY_STRING_SEED", ""],
        ["NULL_SEED", null],
      ],
    });

    const scope: WireScope = container.get(WireScope);

    expect(scope.getSeed("FALSE_SEED")).toBe(false);
    expect(scope.getSeed("ZERO_SEED")).toBe(0);
    expect(scope.getSeed("EMPTY_STRING_SEED")).toBe("");
    expect(scope.getSeed("NULL_SEED")).toBeNull();
    expect(scope.getSeed("MISSING_SEED")).toBeNull();
  });

  it("should use provided seeds", () => {
    const TEST_TOKEN: unique symbol = Symbol.for("TEST_TOKEN");
    const container: Container = createContainer({
      seeds: [[TEST_TOKEN, { data: 123 }]],
    });

    const seedsMap: Map<unknown, unknown> = container.get(SEEDS_TOKEN);

    expect(seedsMap.get(TEST_TOKEN)).toEqual({ data: 123 });
  });

  it("should bind provided bindings", () => {
    class TestService {}
    const container: Container = createContainer({
      bindings: [TestService],
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
      activate: [TestService],
      bindings: [TestService],
    });

    expect(activated).toBe(true);
  });

  it("should activate instance descriptors by descriptor id", () => {
    const TOKEN: unique symbol = Symbol("test-service");
    let activated: boolean = false;

    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    const container: Container = createContainer({
      activate: [TOKEN],
      bindings: [
        {
          bindingType: BindingType.Instance,
          id: TOKEN,
          value: TestService,
        },
      ],
    });

    expect(activated).toBe(true);
    expect(container.get(TOKEN)).toBeInstanceOf(TestService);
  });

  it("should activate all provided bindings when activate is true", () => {
    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class FirstService {
      public constructor() {
        lifecycleEvents.push("first");
      }
    }

    @Injectable()
    class SecondService {
      public constructor() {
        lifecycleEvents.push("second");
      }
    }

    createContainer({
      activate: true,
      bindings: [FirstService, SecondService],
    });

    expect(lifecycleEvents).toEqual(["first", "second"]);
  });

  it("should not activate provided bindings when activate is false", () => {
    let activated: boolean = false;

    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    createContainer({
      activate: false,
      bindings: [TestService],
    });

    expect(activated).toBe(false);
  });

  it("should throw error if activate is provided without bindings", () => {
    expect(() =>
      createContainer({
        activate: ["SomeService"],
      })
    ).toThrow("Supplied activation list while container bindings are not provided.");
  });

  it("should throw error if activated service is not in bindings", () => {
    @Injectable()
    class TestService {}

    expect(() =>
      createContainer({
        activate: ["OtherService"],
        bindings: [TestService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");
  });
});
