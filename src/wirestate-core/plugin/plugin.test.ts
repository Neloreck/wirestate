import {
  type ServiceToken,
  type WirestatePlugin,
  Container,
  EventsPlugin,
  Injectable,
  OnActivation,
  OnDeactivation,
  OnDeprovision,
  OnEvent,
  OnProvision,
} from "../index";

describe("container plugins", () => {
  it("dispatches lifecycle hooks, bracketing user hooks", () => {
    const log: Array<string> = [];

    @Injectable()
    class Svc {
      @OnActivation()
      public onActivation(): void {
        log.push("user:activated");
      }

      @OnProvision()
      public onProvision(): void {
        log.push("user:provision");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        log.push("user:deprovision");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        log.push("user:deactivation");
      }
    }

    class Observer implements WirestatePlugin {
      public onContainerProvision(): void {
        log.push("plugin:containerProvision");
      }

      public onContainerDeprovision(): void {
        log.push("plugin:containerDeprovision");
      }

      public onActivate(instance: object): void {
        log.push(`plugin:activate:${instance.constructor.name}`);
      }

      public onDeactivate(instance: object): void {
        log.push(`plugin:deactivate:${instance.constructor.name}`);
      }

      public onProvision(instance: object): void {
        log.push(`plugin:provision:${instance.constructor.name}`);
      }

      public onDeprovision(instance: object): void {
        log.push(`plugin:deprovision:${instance.constructor.name}`);
      }
    }

    const container: Container = new Container({ bindings: [Svc], activate: [Svc], plugins: [new Observer()] });

    // Setup: plugin onActivate runs before the user @OnActivation.
    expect(log).toEqual(["plugin:activate:Svc", "user:activated"]);

    log.length = 0;
    container.provision();

    // Setup: boundary, then plugin wiring, then user @OnProvision.
    expect(log).toEqual(["plugin:containerProvision", "plugin:provision:Svc", "user:provision"]);

    log.length = 0;
    container.deprovision();

    // Teardown: user @OnDeprovision, then plugin onDeprovision, then boundary.
    expect(log).toEqual(["user:deprovision", "plugin:deprovision:Svc", "plugin:containerDeprovision"]);

    log.length = 0;
    container.unbindAll();

    // Teardown: user @OnDeactivation before plugin onDeactivate.
    expect(log).toEqual(["user:deactivation", "plugin:deactivate:Svc"]);
  });

  it("force-activates participants and runs disposers on deprovision", () => {
    const log: Array<string> = [];

    @Injectable()
    class Handler {}

    class WiringPlugin implements WirestatePlugin {
      public participates(token: ServiceToken): boolean {
        return token === Handler;
      }

      public onProvision(instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        log.push(`wire:${instance.constructor.name}`);
        addDisposer(() => log.push(`unwire:${instance.constructor.name}`));
      }
    }

    const container: Container = new Container({ bindings: [Handler], plugins: [new WiringPlugin()] });

    // Nobody injected Handler and it is not in `activate`, so it is dormant...
    expect(container.getActiveInstances()).toEqual([]);

    container.provision();

    // ...until provision force-activates it because the plugin participates.
    expect(log).toEqual(["wire:Handler"]);

    container.deprovision();
    expect(log).toEqual(["wire:Handler", "unwire:Handler"]);
  });

  it("inherited plugins observe descendant containers", () => {
    const seen: Array<string> = [];

    class Observer implements WirestatePlugin {
      public onActivate(instance: object): void {
        seen.push(instance.constructor.name);
      }
    }

    @Injectable()
    class ParentSvc {}

    @Injectable()
    class ChildSvc {}

    const parent: Container = new Container({
      activate: true,
      bindings: [ParentSvc],
      plugins: [new Observer()],
    });

    new Container({ parent, bindings: [ChildSvc], activate: [ChildSvc] });

    expect(seen).toContain("ParentSvc");
    expect(seen).toContain("ChildSvc");
  });

  it("install contributes a binding resolvable from the container", () => {
    const TOKEN: symbol = Symbol("X");

    class BindingPlugin implements WirestatePlugin {
      public install(container: Container): void {
        container.bind({ token: TOKEN, value: 42 });
      }
    }

    const container: Container = new Container({ plugins: [new BindingPlugin()] });

    expect(container.get<number>(TOKEN)).toBe(42);
  });

  it("throws when a handler's kind is handled by a plugin but its bus is not bound", () => {
    // A messaging plugin that declares its kind (so provision validation passes) but
    // skips binding its bus - so onProvision finds no bus up the chain and must throw.
    class BuslessEventsPlugin extends EventsPlugin {
      public override install(): void {
        // Intentionally do not bind the EventBus.
      }
    }

    @Injectable()
    class ListenerService {
      @OnEvent("PING")
      public onPing(): void {}
    }

    expect(() =>
      new Container({ bindings: [ListenerService], plugins: [new BuslessEventsPlugin()] }).provision()
    ).toThrow(
      "Service 'ListenerService' declares a messaging handler but no 'EventBus' is bound on its container or any ancestor."
    );
  });

  it("teardown is failsafe: a throwing disposer or onDeprovision never aborts deprovision", () => {
    const log: Array<string> = [];

    @Injectable()
    class Svc {}

    class ThrowingTeardown implements WirestatePlugin {
      public onProvision(_instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => {
          throw new Error("dispose boom");
        });
      }

      public onDeprovision(): void {
        throw new Error("deprovision boom");
      }

      public onContainerDeprovision(): void {
        log.push("containerDeprovision");
      }
    }

    const container: Container = new Container({
      activate: true,
      bindings: [Svc],
      plugins: [new ThrowingTeardown()],
    });

    container.provision();

    expect(() => container.deprovision()).not.toThrow();
    expect(log).toEqual(["containerDeprovision"]);
  });

  it("rolls back plugin wiring when onProvision throws, then re-provisions cleanly", () => {
    const log: Array<string> = [];

    @Injectable()
    class First {}

    @Injectable()
    class Second {}

    class WireThenMaybeThrowPlugin implements WirestatePlugin {
      public failing: boolean = true;

      public participates(token: ServiceToken): boolean {
        return token === First || token === Second;
      }

      public onProvision(instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        if (this.failing && instance.constructor.name === "Second") {
          throw new Error("wire boom");
        }

        log.push(`wire:${instance.constructor.name}`);
        addDisposer(() => log.push(`unwire:${instance.constructor.name}`));
      }
    }

    const plugin: WireThenMaybeThrowPlugin = new WireThenMaybeThrowPlugin();
    const container: Container = new Container({ bindings: [First, Second], plugins: [plugin] });

    // Provision aborts wiring Second; the already-wired First is rolled back (its disposer runs).
    expect(() => container.provision()).toThrow("wire boom");
    expect(log).toEqual(["wire:First", "unwire:First"]);

    // The container is left clean, so a subsequent provision succeeds once the fault is gone.
    log.length = 0;
    plugin.failing = false;
    expect(() => container.provision()).not.toThrow();
    expect(log).toEqual(["wire:First", "wire:Second"]);

    log.length = 0;
    container.deprovision();
    expect(log).toEqual(["unwire:First", "unwire:Second"]);
  });

  it("runs an instance's disposers in reverse registration order", () => {
    const log: Array<string> = [];

    @Injectable()
    class Svc {}

    // Two plugins, and one plugin parking two disposers, so the order spans both a single
    // `addDisposer` sequence and the plugin dispatch order that produced them.
    class FirstPlugin implements WirestatePlugin {
      public participates(token: ServiceToken): boolean {
        return token === Svc;
      }

      public onProvision(_instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => log.push("first:a"));
        addDisposer(() => log.push("first:b"));
      }
    }

    class SecondPlugin implements WirestatePlugin {
      public onProvision(_instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => log.push("second"));
      }
    }

    const container: Container = new Container({
      bindings: [Svc],
      plugins: [new FirstPlugin(), new SecondPlugin()],
    });

    container.provision();
    container.deprovision();

    // Registered first:a, first:b, second - so teardown unwinds them last-in-first-out.
    expect(log).toEqual(["second", "first:b", "first:a"]);
  });

  it("runs the remaining disposers when one throws, in reverse registration order", () => {
    const log: Array<string> = [];

    @Injectable()
    class Svc {}

    class ThrowingDisposerPlugin implements WirestatePlugin {
      public participates(token: ServiceToken): boolean {
        return token === Svc;
      }

      public onProvision(_instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => log.push("first"));
        addDisposer(() => {
          log.push("second");

          throw new Error("dispose boom");
        });
        addDisposer(() => log.push("third"));
      }
    }

    const container: Container = new Container({ bindings: [Svc], plugins: [new ThrowingDisposerPlugin()] });

    container.provision();

    expect(() => container.deprovision()).not.toThrow();
    expect(log).toEqual(["third", "second", "first"]);
  });

  it("contains a throwing disposer so sibling instances still tear down", () => {
    const log: Array<string> = [];

    @Injectable()
    class First {}

    @Injectable()
    class Second {}

    class TwoDisposerPlugin implements WirestatePlugin {
      public participates(token: ServiceToken): boolean {
        return token === First || token === Second;
      }

      public onProvision(instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => {
          log.push(`unwire:${instance.constructor.name}`);

          if (instance.constructor.name === "First") {
            throw new Error("dispose boom");
          }
        });
      }
    }

    const container: Container = new Container({ bindings: [First, Second], plugins: [new TwoDisposerPlugin()] });

    container.provision();

    // First's disposer throws, but the failure is contained so Second's disposer still runs.
    expect(() => container.deprovision()).not.toThrow();
    expect(log).toEqual(["unwire:First", "unwire:Second"]);
  });

  it("pairs onDeprovision with onProvision for non-participant instances", () => {
    const log: Array<string> = [];

    @Injectable()
    class PlainService {}

    @Injectable()
    class Participant {
      @OnProvision()
      public onProvision(): void {}
    }

    @Injectable()
    class LazyService {}

    // Claims no participants, so every instance it sees is one `onProvision` reached on its own.
    class BystanderPlugin implements WirestatePlugin {
      public onProvision(instance: object): void {
        log.push(`+${instance.constructor.name}`);
      }

      public onDeprovision(instance: object): void {
        log.push(`-${instance.constructor.name}`);
      }
    }

    const container: Container = new Container({
      activate: [PlainService],
      bindings: [PlainService, Participant, LazyService],
      plugins: [new BystanderPlugin()],
    });

    container.provision();

    expect(log).toEqual(["+PlainService", "+Participant"]);

    // Resolved after the cycle wired its instances, so this one never received `onProvision`...
    container.get(LazyService);

    log.length = 0;
    container.deprovision();

    // ...and must not receive `onDeprovision` either. Everything that was wired tears down, in
    // reverse ledger order: participants enter the ledger first (they are force-activated before
    // plugins are wired), so they tear down last.
    expect(log).toEqual(["-PlainService", "-Participant"]);

    // The cycle is dropped at deprovision, so a repeated deprovision cannot re-run it.
    container.deprovision();

    expect(log).toEqual(["-PlainService", "-Participant"]);
  });

  it("keeps @OnDeprovision in reverse provision order while plugins tear down the wider set", () => {
    const log: Array<string> = [];

    @Injectable()
    class PlainService {}

    @Injectable()
    class First {
      @OnDeprovision()
      public onDeprovision(): void {
        log.push("user:-First");
      }
    }

    @Injectable()
    class Second {
      @OnDeprovision()
      public onDeprovision(): void {
        log.push("user:-Second");
      }
    }

    class BystanderPlugin implements WirestatePlugin {
      public onDeprovision(instance: object): void {
        log.push(`plugin:-${instance.constructor.name}`);
      }
    }

    const container: Container = new Container({
      activate: [PlainService],
      bindings: [PlainService, First, Second],
      plugins: [new BystanderPlugin()],
    });

    container.provision();
    container.deprovision();

    // Widening the plugin set must not disturb the documented user-hook order: every
    // @OnDeprovision still runs first, in reverse provision order, before any plugin teardown.
    expect(log.slice(0, 2)).toEqual(["user:-Second", "user:-First"]);
    expect(log.slice(2).sort()).toEqual(["plugin:-First", "plugin:-PlainService", "plugin:-Second"]);
  });

  it("runs disposers parked on non-participant instances at deprovision", () => {
    const log: Array<string> = [];

    @Injectable()
    class PlainService {}

    // Claims no participants, but `onProvision` still reaches every active instance and may
    // park a disposer on one, so deprovision has to sweep those too.
    class BystanderPlugin implements WirestatePlugin {
      public onProvision(instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
        addDisposer(() => log.push(`unwire:${instance.constructor.name}`));
      }
    }

    const container: Container = new Container({
      activate: [PlainService],
      bindings: [PlainService],
      plugins: [new BystanderPlugin()],
    });

    container.provision();

    expect(log).toEqual([]);

    container.deprovision();

    expect(log).toEqual(["unwire:PlainService"]);

    // The cycle is dropped at deprovision, so a repeated deprovision cannot re-run it.
    container.deprovision();

    expect(log).toEqual(["unwire:PlainService"]);

    // A new cycle parks a fresh disposer that tears down on its own deprovision.
    container.provision();
    container.deprovision();

    expect(log).toEqual(["unwire:PlainService", "unwire:PlainService"]);
  });
});
