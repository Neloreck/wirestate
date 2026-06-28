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
});
