import {
  Container,
  EventBus,
  EventsPlugin,
  inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnDeprovision,
  OnEvent,
} from "@wirestate/core";

describe("core event messaging integration", () => {
  it("keeps parent and child event buses separate", () => {
    const LOG_EVENT: string = "LOG_EVENT";
    const PARENT_TOKEN: string = "PARENT_TOKEN";

    @Injectable()
    class ParentListenerService {
      public readonly events: Array<string> = [];

      @OnEvent(LOG_EVENT)
      public onLogEvent(event: { readonly payload?: string }): void {
        this.events.push(`parent:${event.payload ?? "empty"}`);
      }
    }

    @Injectable()
    class ChildListenerService {
      public readonly events: Array<string> = [];

      @OnEvent(LOG_EVENT)
      public onLogEvent(event: { readonly payload?: string }): void {
        this.events.push(`child:${event.payload ?? "empty"}`);
      }
    }

    const parent: Container = new Container({
      activate: [ParentListenerService],
      bindings: [ParentListenerService, { token: PARENT_TOKEN, value: "root-value" }],
      plugins: [new EventsPlugin()],
    }).provision();

    const child: Container = new Container({
      activate: [ChildListenerService],
      bindings: [ChildListenerService],
      parent: parent,
      plugins: [new EventsPlugin()],
    }).provision();

    expect(child.get(PARENT_TOKEN)).toBe("root-value");
    expect(child.get(EventBus)).not.toBe(parent.get(EventBus));

    parent.get(EventBus).emit(LOG_EVENT, "from-parent");
    child.get(EventBus).emit(LOG_EVENT, "from-child");

    expect(parent.get(ParentListenerService).events).toEqual(["parent:from-parent"]);
    expect(child.get(ChildListenerService).events).toEqual(["child:from-child"]);

    child.unbindAll();

    parent.get(EventBus).emit(LOG_EVENT, "from-parent");

    expect(parent.get(ParentListenerService).events).toEqual(["parent:from-parent", "parent:from-parent"]);
  });

  it("broadcasts events to all active services and removes only disconnected listeners", () => {
    const TOUCH_EVENT: string = "TOUCH_EVENT";
    const lifecycle: Array<string> = [];
    const events: Array<string> = [];

    @Injectable()
    class PrimaryHandlerService {
      @OnActivated()
      public onActivated(): void {
        lifecycle.push("primary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("primary:deactivated");
      }

      @OnEvent(TOUCH_EVENT)
      public onTouch(event: { readonly payload?: string }): void {
        events.push(`primary:${event.payload ?? "empty"}`);
      }
    }

    @Injectable()
    class SecondaryHandlerService {
      @OnActivated()
      public onActivated(): void {
        lifecycle.push("secondary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("secondary:deactivated");
      }

      @OnEvent(TOUCH_EVENT)
      public onTouch(event: { readonly payload?: string }): void {
        events.push(`secondary:${event.payload ?? "empty"}`);
      }
    }

    const container: Container = new Container({
      activate: [PrimaryHandlerService, SecondaryHandlerService],
      bindings: [PrimaryHandlerService, SecondaryHandlerService],
      plugins: [new EventsPlugin()],
    }).provision();

    const bus: EventBus = container.get(EventBus);

    expect(lifecycle).toEqual(["primary:activated", "secondary:activated"]);

    bus.emit(TOUCH_EVENT, "one");
    expect(events).toEqual(["primary:one", "secondary:one"]);
    expect(bus.hasSubscribers()).toBe(true);

    container.unbind(SecondaryHandlerService);
    expect(lifecycle).toEqual(["primary:activated", "secondary:activated", "secondary:deactivated"]);

    bus.emit(TOUCH_EVENT, "two");
    expect(events).toEqual(["primary:one", "secondary:one", "primary:two"]);

    container.unbind(PrimaryHandlerService);
    bus.emit(TOUCH_EVENT, "three");

    expect(events).toEqual(["primary:one", "secondary:one", "primary:two"]);
    expect(bus.hasSubscribers()).toBe(false);
  });

  it("lets a service emit events while it deprovisions", () => {
    const DEACTIVATE_EVENT: string = "DEACTIVATE_EVENT";
    const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

    const logs: Array<string> = [];

    interface SettingsData {
      readonly label: string;
    }

    @Injectable()
    class CleanupService {
      public constructor(
        private readonly container: Container = inject(Container),
        private readonly eventBus: EventBus = inject(EventBus)
      ) {}

      @OnDeprovision()
      public onDeprovision(): void {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        logs.push(`settings:${settings.label}`);
        this.eventBus.emit(DEACTIVATE_EVENT, "cleanup");
      }

      @OnEvent(DEACTIVATE_EVENT)
      public onEvent(event: { readonly payload?: string }): void {
        logs.push(`event:${event.payload ?? "empty"}`);
      }
    }

    const container: Container = new Container({
      activate: [CleanupService],
      bindings: [CleanupService, { token: SETTINGS_TOKEN, value: { label: "cleanup-label" } }],
      plugins: [new EventsPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["settings:cleanup-label", "event:cleanup"]);
    expect(container.has(CleanupService)).toBe(false);
    expect(container.has(EventBus)).toBe(false);
  });

  it("lets services emit events to each other while deprovisioning", () => {
    const PEER_DEACTIVATE_EVENT: string = "PEER_DEACTIVATE_EVENT";

    const logs: Array<string> = [];

    @Injectable()
    class DeactivationPeerService {
      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("peer-deprovision");
      }

      @OnEvent(PEER_DEACTIVATE_EVENT)
      public onEvent(event: { readonly payload?: string }): void {
        logs.push(`peer-event:${event.payload ?? "empty"}`);
      }
    }

    @Injectable()
    class DeactivationCoordinatorService {
      public constructor(private readonly eventBus: EventBus = inject(EventBus)) {}

      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("coordinator-deprovision");
        this.eventBus.emit(PEER_DEACTIVATE_EVENT, "from-coordinator");
      }
    }

    new Container({
      activate: [DeactivationCoordinatorService, DeactivationPeerService],
      bindings: [DeactivationPeerService, DeactivationCoordinatorService],
      plugins: [new EventsPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["coordinator-deprovision", "peer-event:from-coordinator", "peer-deprovision"]);
  });

  it("subscribes and tears down a catch-all @OnEvent handler through the container", () => {
    const ALPHA: string = "ALPHA";
    const BETA: string = "BETA";

    @Injectable()
    class AuditService {
      public readonly seen: Array<string> = [];

      @OnEvent()
      public onAny(event: { readonly type: string }): void {
        this.seen.push(event.type);
      }
    }

    const container: Container = new Container({
      activate: [AuditService],
      bindings: [AuditService],
      plugins: [new EventsPlugin()],
    }).provision();

    const bus: EventBus = container.get(EventBus);
    const audit: AuditService = container.get(AuditService);

    bus.emit(ALPHA);
    bus.emit(BETA);

    expect(audit.seen).toEqual([ALPHA, BETA]);
    expect(bus.hasSubscribers()).toBe(true);

    container.deprovision();

    // The catch-all subscription is unwired at deprovision, so later emits are ignored.
    expect(bus.hasSubscribers()).toBe(false);

    bus.emit(ALPHA);

    expect(audit.seen).toEqual([ALPHA, BETA]);
  });
});
