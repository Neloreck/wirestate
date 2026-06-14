import { getActivatedHandlerMetadata, OnActivated } from "../activation/on-activated";
import { OnDeactivation } from "../activation/on-deactivation";
import { Container } from "../container/container";
import { WirestateError } from "../error/wirestate-error";
import { CommandBus } from "../messaging/commands/command-bus";
import { OnCommand } from "../messaging/commands/on-command";
import { EventBus } from "../messaging/events/event-bus";
import { WireEvent } from "../messaging/events/events";
import { OnEvent } from "../messaging/events/on-event";
import { OnQuery } from "../messaging/queries/on-query";
import { QueryBus } from "../messaging/queries/query-bus";
import { Injectable } from "../metadata/metadata-injectable";
import { OnDeprovision } from "../provision/on-deprovision";
import { OnProvision } from "../provision/on-provision";
import { deprovisionContainer, provisionContainer } from "../provision/provision-lifecycle";

/**
 * Shared dual-mode decorator behavior matrix.
 *
 * This suite runs under BOTH jest configs: the default legacy run
 * (experimental decorators via babel `legacy: true`) and the TC39 run
 * (`cli/test/jest.tc39.config.js`, babel `version: "2023-11"`). Every
 * assertion is intentionally mode-agnostic: no WeakMap introspection and no
 * exact duplicate-message strings, because the storage channel and the
 * decoration-time error text differ between modes.
 */
describe("dual-mode method decorators", () => {
  it("should register and run messaging handlers through container resolution", () => {
    @Injectable()
    class MessagingService {
      public received: Array<string> = [];

      @OnEvent("PING")
      public onPing(event: WireEvent<string>): void {
        this.received.push(String(event.payload));
      }

      @OnQuery("GET_RECEIVED_COUNT")
      public onGetReceivedCount(): number {
        return this.received.length;
      }

      @OnCommand("APPEND_VALUE")
      public onAppendValue(value: string): string {
        this.received.push(value);

        return `appended:${value}`;
      }
    }

    const container: Container = new Container({ bindings: [EventBus, QueryBus, CommandBus, MessagingService] });
    const service: MessagingService = container.get(MessagingService);

    container.get(EventBus).emit("PING", "one");
    container.get(EventBus).emit("PING", "two");

    expect(service.received).toEqual(["one", "two"]);
    expect(container.get(QueryBus).query("GET_RECEIVED_COUNT")).toBe(2);
    expect(container.get(CommandBus).execute("APPEND_VALUE", "three")).toBe("appended:three");
    expect(service.received).toEqual(["one", "two", "three"]);
  });

  it("should run all four lifecycle hooks across provision and unbind", () => {
    const log: Array<string> = [];

    @Injectable()
    class LifecycleProbeService {
      @OnActivated()
      public onActivated(): void {
        log.push("activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        log.push("deactivation");
      }

      @OnProvision()
      public onProvision(): void {
        log.push("provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        log.push("deprovision");
      }
    }

    const container: Container = new Container({ bindings: [LifecycleProbeService] });

    // Provision participation is decided from the bare class prototype before
    // any instance exists, so this exercises the static metadata read path.
    provisionContainer(container);
    expect(log).toEqual(["activated", "provision"]);

    container.unbind(LifecycleProbeService);
    expect(log).toEqual(["activated", "provision", "deprovision", "deactivation"]);
  });

  it("should deprovision explicitly through deprovisionContainer", () => {
    const log: Array<string> = [];

    @Injectable()
    class DeprovisionProbeService {
      @OnProvision()
      public onProvision(): void {
        log.push("provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        log.push("deprovision");
      }
    }

    const container: Container = new Container({ bindings: [DeprovisionProbeService] });

    provisionContainer(container);
    deprovisionContainer(container);

    expect(log).toEqual(["provision", "deprovision"]);
  });

  it("should inherit base class handlers without duplication", () => {
    const log: Array<string> = [];

    @Injectable()
    class BaseMessagingService {
      public events: Array<string> = [];

      @OnActivated()
      public onActivated(): void {
        log.push("base-activated");
      }

      @OnEvent("BASE_EVENT")
      public onBaseEvent(event: WireEvent<string>): void {
        this.events.push(`base:${event.payload}`);
      }

      @OnQuery("BASE_QUERY")
      public onBaseQuery(): string {
        return "base-answer";
      }
    }

    @Injectable()
    class ChildMessagingService extends BaseMessagingService {
      @OnEvent("CHILD_EVENT")
      public onChildEvent(event: WireEvent<string>): void {
        this.events.push(`child:${event.payload}`);
      }
    }

    const container: Container = new Container({ bindings: [EventBus, QueryBus, ChildMessagingService] });
    const child: ChildMessagingService = container.get(ChildMessagingService);

    expect(log).toEqual(["base-activated"]);

    container.get(EventBus).emit("BASE_EVENT", "a");
    container.get(EventBus).emit("CHILD_EVENT", "b");

    // Exactly one delivery per event: base metadata is not re-attributed to the child.
    expect(child.events).toEqual(["base:a", "child:b"]);
    expect(container.get(QueryBus).query("BASE_QUERY")).toBe("base-answer");
  });

  it("should allow a subclass to redecorate the same lifecycle method name", () => {
    const log: Array<string> = [];

    @Injectable()
    class BaseLifecycleService {
      @OnActivated()
      public onActivated(): void {
        log.push("base-activated");
      }
    }

    @Injectable()
    class RedecoratedChildService extends BaseLifecycleService {
      @OnActivated()
      public override onActivated(): void {
        log.push("child-activated");
      }
    }

    const container: Container = new Container({ bindings: [RedecoratedChildService] });

    container.get(RedecoratedChildService);

    expect(log).toEqual(["child-activated"]);
  });

  it("should resolve lifecycle metadata declared only on the base class", () => {
    class BaseOnlyService {
      @OnActivated()
      public onActivated(): void {}
    }

    class UndecoratedChildService extends BaseOnlyService {}

    expect(getActivatedHandlerMetadata(new UndecoratedChildService())).toBe("onActivated");
  });

  it("should throw a hierarchy conflict when two different lifecycle methods are decorated", () => {
    class ConflictBaseService {
      @OnActivated()
      public first(): void {}
    }

    class ConflictChildService extends ConflictBaseService {
      @OnActivated()
      public second(): void {}
    }

    expect(() => getActivatedHandlerMetadata(new ConflictChildService())).toThrow(WirestateError);
    expect(() => getActivatedHandlerMetadata(new ConflictChildService())).toThrow(
      /Only one @OnActivated method can be declared across class hierarchy/
    );
  });

  it("should reject duplicate @OnActivated methods on one class at decoration time", () => {
    expect(() => {
      class DuplicatedActivationService {
        @OnActivated()
        public first(): void {}

        @OnActivated()
        public second(): void {}
      }

      return DuplicatedActivationService;
    }).toThrow(WirestateError);

    expect(() => {
      class DuplicatedActivationMessageService {
        @OnActivated()
        public first(): void {}

        @OnActivated()
        public second(): void {}
      }

      return DuplicatedActivationMessageService;
    }).toThrow(/Only one @OnActivated method can be declared/);
  });

  it("should reject duplicate @OnProvision methods on one class at decoration time", () => {
    expect(() => {
      class DuplicatedProvisionService {
        @OnProvision()
        public first(): void {}

        @OnProvision()
        public second(): void {}
      }

      return DuplicatedProvisionService;
    }).toThrow(/Only one @OnProvision method can be declared/);
  });

  it("should support multiple messaging decorations per class and per method", () => {
    @Injectable()
    class MultiHandlerService {
      public events: Array<string> = [];

      @OnEvent(["FIRST_EVENT", "SECOND_EVENT"])
      public onEither(event: WireEvent<string>): void {
        this.events.push(String(event.type));
      }

      @OnQuery("FIRST_QUERY")
      public onFirstQuery(): string {
        return "first";
      }

      @OnQuery("SECOND_QUERY")
      public onSecondQuery(): string {
        return "second";
      }
    }

    const container: Container = new Container({ bindings: [EventBus, QueryBus, MultiHandlerService] });
    const service: MultiHandlerService = container.get(MultiHandlerService);

    container.get(EventBus).emit("FIRST_EVENT");
    container.get(EventBus).emit("SECOND_EVENT");

    expect(service.events).toEqual(["FIRST_EVENT", "SECOND_EVENT"]);
    expect(container.get(QueryBus).query("FIRST_QUERY")).toBe("first");
    expect(container.get(QueryBus).query("SECOND_QUERY")).toBe("second");
  });

  it("should stop delivering events after deactivation", () => {
    @Injectable()
    class UnsubscribingService {
      public events: Array<string> = [];

      @OnEvent("TRACKED_EVENT")
      public onTrackedEvent(event: WireEvent<string>): void {
        this.events.push(String(event.payload));
      }
    }

    const container: Container = new Container({ bindings: [EventBus, UnsubscribingService] });
    const service: UnsubscribingService = container.get(UnsubscribingService);
    const eventBus: EventBus = container.get(EventBus);

    eventBus.emit("TRACKED_EVENT", "before");
    container.unbind(UnsubscribingService);
    eventBus.emit("TRACKED_EVENT", "after");

    expect(service.events).toEqual(["before"]);
  });
});
