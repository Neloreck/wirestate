import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { BindingType } from "../binding/binding";
import { getConfiguredInternalErrorHandler } from "../error/internal-error-handler";
import { CommandBus } from "../messaging/commands/command-bus";
import { EventBus } from "../messaging/events/event-bus";
import { QueryBus } from "../messaging/queries/query-bus";
import { Injectable } from "../metadata/metadata-injectable";
import { WireScope } from "../scope/wire-scope";

import { Container } from "./container";
import { inject } from "./container-context";

describe("Container", () => {
  it("should create a container with default essentials", () => {
    const container: Container = new Container();

    expect(container).toBeInstanceOf(Container);
    expect(container.get(Container)).toBe(container);
    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.hasOwn(EventBus)).toBe(true);
    expect(container.hasOwn(QueryBus)).toBe(true);
    expect(container.hasOwn(CommandBus)).toBe(true);
    expect(container.hasOwn(WireScope)).toBe(true);
    expect(getConfiguredInternalErrorHandler(container)).toBeUndefined();
  });

  it("should bind core buses as singletons by default", () => {
    const container: Container = new Container();

    expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    expect(container.get(EventBus)).toBe(container.get(EventBus));
    expect(container.get(QueryBus)).toBeInstanceOf(QueryBus);
    expect(container.get(QueryBus)).toBe(container.get(QueryBus));
    expect(container.get(CommandBus)).toBeInstanceOf(CommandBus);
    expect(container.get(CommandBus)).toBe(container.get(CommandBus));
  });

  it("should skip core buses when skipMessaging is true", () => {
    const container: Container = new Container({}, { skipMessaging: true });

    expect(container.hasOwn(EventBus)).toBe(false);
    expect(container.hasOwn(QueryBus)).toBe(false);
    expect(container.hasOwn(CommandBus)).toBe(false);
    expect(container.hasOwn(Container)).toBe(true);
    expect(container.hasOwn(WireScope)).toBe(true);
  });

  it("should let a skipMessaging child use parent messaging bindings", () => {
    const receivedEvents: Array<string> = [];

    @Injectable()
    class ParentMessagingService {
      public constructor(eventBus: EventBus = inject(EventBus)) {
        eventBus.subscribe((event) => receivedEvents.push(String(event.payload)));
      }
    }

    @Injectable()
    class ChildMessagingService {
      public constructor(private readonly eventBus: EventBus = inject(EventBus)) {}

      public emit(message: string): void {
        this.eventBus.emit("child-message", message);
      }
    }

    const parent: Container = new Container({
      activate: true,
      bindings: [ParentMessagingService],
    });
    const child: Container = new Container({ parent, bindings: [ChildMessagingService] }, { skipMessaging: true });

    expect(child.hasOwn(EventBus)).toBe(false);
    expect(child.has(EventBus)).toBe(true);
    expect(child.hasOwn(QueryBus)).toBe(false);
    expect(child.has(QueryBus)).toBe(true);
    expect(child.hasOwn(CommandBus)).toBe(false);
    expect(child.has(CommandBus)).toBe(true);
    expect(child.get(EventBus)).toBe(parent.get(EventBus));

    child.get(ChildMessagingService).emit("from-child");

    expect(receivedEvents).toEqual(["from-child"]);
  });

  it("should bind WireScope in transient scope", () => {
    const container: Container = new Container();

    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.get(WireScope)).not.toBe(container.get(WireScope));
  });

  it("should bind WireScope with injected container", () => {
    const container: Container = new Container();

    expect(container.get(WireScope)).toBeInstanceOf(WireScope);
    expect(container.get(WireScope)).not.toBe(container.get(WireScope));
    expect(container.get(WireScope)["container"]).toBe(container);
    expect(container.get(WireScope)["container"]).toBe(container);
  });

  it("should respect parent container", () => {
    const parent: Container = new Container();
    const PARENT_TOKEN: unique symbol = Symbol.for("PARENT_TOKEN");

    parent.bind({ token: PARENT_TOKEN, value: "parent-value" });

    const container: Container = new Container({ parent });

    expect(container.parent).toBe(parent);
    expect(container.get(PARENT_TOKEN)).toBe("parent-value");
  });

  it("should use configured error handler", () => {
    const onError = jest.fn();
    const container: Container = new Container({ onError });

    expect(getConfiguredInternalErrorHandler(container)).toBe(onError);
  });

  it("should inherit parent error handler when none is configured", () => {
    const onError = jest.fn();
    const parent: Container = new Container({ onError });
    const container: Container = new Container({ parent });

    expect(getConfiguredInternalErrorHandler(container)).toBe(onError);
  });

  it("should isolate messaging from its parent", () => {
    const parent: Container = new Container();
    const container: Container = new Container({ parent });

    expect(container.get(EventBus)).not.toBe(parent.get(EventBus));
    expect(container.get(QueryBus)).not.toBe(parent.get(QueryBus));
    expect(container.get(CommandBus)).not.toBe(parent.get(CommandBus));
  });

  it("should use Singleton as default scope for new bindings", () => {
    const container: Container = new Container();

    @Injectable()
    class TestService {}

    container.bind(TestService);

    expect(container.get(TestService)).toBe(container.get(TestService));
  });

  it("should bind provided bindings", () => {
    @Injectable()
    class TestService {}
    const container: Container = new Container({
      bindings: [TestService],
    });

    expect(container.get(TestService)).toBeInstanceOf(TestService);
  });

  it("should activate provided services", () => {
    let activated: boolean = false;

    @Injectable()
    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    new Container({
      activate: [TestService],
      bindings: [TestService],
    });

    expect(activated).toBe(true);
  });

  it("should activate instance descriptors by descriptor token", () => {
    const TOKEN: unique symbol = Symbol("token");
    let activated: boolean = false;

    @Injectable()
    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    const container: Container = new Container({
      activate: [TOKEN],
      bindings: [
        {
          type: BindingType.Instance,
          token: TOKEN,
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

    new Container({
      activate: true,
      bindings: [FirstService, SecondService],
    });

    expect(lifecycleEvents).toEqual(["first", "second"]);
  });

  it("should not activate provided bindings when activate is false", () => {
    let activated: boolean = false;

    @Injectable()
    @Injectable()
    class TestService {
      public constructor() {
        activated = true;
      }
    }

    new Container({
      activate: false,
      bindings: [TestService],
    });

    expect(activated).toBe(false);
  });

  it("should run lifecycle hooks for activated bindings", () => {
    const { LifecycleService, events } = createLifecycleService();

    const container: Container = new Container({
      activate: [LifecycleService],
      bindings: [LifecycleService],
    });

    expect(container.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(events).toEqual(["activated"]);

    container.unbindAll();

    expect(events).toEqual(["activated", "deactivation"]);
  });

  it("should throw error if activate is provided without bindings", () => {
    expect(
      () =>
        new Container({
          activate: ["SomeService"],
        })
    ).toThrow("Supplied activation list while container bindings are not provided.");
  });

  it("should throw error if activated instance is not in bindings", () => {
    @Injectable()
    @Injectable()
    class TestService {}

    expect(
      () =>
        new Container({
          activate: ["OtherService"],
          bindings: [TestService],
        })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");
  });
});
