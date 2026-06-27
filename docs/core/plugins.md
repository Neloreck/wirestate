# Core Plugins

A plugin is a class that observes or extends the container lifecycle. Register plugins on a container through
`config.plugins`; each one hooks into activation and provision to do cross-cutting work: wiring messaging, inspecting
the container from devtools, persisting service state, collecting telemetry.

```ts
import { Container, EventsPlugin } from "@wirestate/core";

const container: Container = new Container({
  bindings: [CartService],
  plugins: [new EventsPlugin()],
});
```

## Built-in Messaging Plugins

The three message buses are themselves plugins. Register the plugin for each kind you use; its `install` contributes the
bus binding, so `inject(EventBus)`, sending, consumer hooks, and `@OnEvent` / `@OnCommand` / `@OnQuery` handlers all work.

```ts
import { CommandsPlugin, Container, EventsPlugin, QueriesPlugin } from "@wirestate/core";

const container: Container = new Container({
  bindings: [CartService],
  plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
});
```

A service that declares a messaging handler throws at provision unless the matching plugin is registered somewhere in the
container chain. See [Events](/core/events), [Commands](/core/commands), and [Queries](/core/queries).

Register a messaging plugin on a child container when that child needs a local bus. Omit it on the child when handlers
should use the nearest ancestor bus.

## Writing a Plugin

Implement [`WirestatePlugin`](/api/wirestate-core/interfaces/WirestatePlugin). Every hook is optional. Implement only
the phases you need.

```ts
import { Container, WirestatePlugin } from "@wirestate/core";

class CustomDevToolsPlugin implements WirestatePlugin {
  public onContainerProvision(container: Container): void {
    console.log("container provisioned", container);
  }

  public onActivate(instance: object): void {
    console.log("activated", instance.constructor.name);
  }

  public onDeactivate(instance: object): void {
    console.log("deactivated", instance.constructor.name);
  }

  public onContainerDeprovision(container: Container): void {
    console.log("container deprovisioned", container);
  }
}

new Container({ bindings: [CartService], plugins: [new CustomDevToolsPlugin()] });
```

## Hooks

| Hook                                            | When                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `install(container)`                            | Once, when the plugin is registered. Contribute bindings here.              |
| `participates(token)`                           | At provision, per binding token. Return `true` to force-activate it.        |
| `onContainerProvision(container)`               | Once, at the start of each provision cycle, before any instance wiring.     |
| `onActivate(instance, container)`               | After a service is activated, before `@OnActivated`.                        |
| `onProvision(instance, container, addDisposer)` | When a provisioned instance is wired. Register teardown with `addDisposer`. |
| `onDeprovision(instance, container)`            | After the instance's `@OnDeprovision`.                                      |
| `onDeactivate(instance, container)`             | After the instance's `@OnDeactivation`.                                     |
| `onContainerDeprovision(container)`             | Once, at the very end of each deprovision cycle.                            |

## Ordering

Plugins are the **framework layer** that brackets the **user layer** (`@OnActivated` / `@OnProvision`):

- On **setup** (activate, provision), plugin hooks run **before** the matching user hook.
- On **teardown** (deactivate, deprovision), they run **after** it.
- Across plugins, hooks run in **registration order** on setup and reverse on teardown.

So a plugin's `onProvision` always runs before any service's `@OnProvision`. This is how a persistence plugin can
hydrate state a provision hook then reads, and how messaging handlers are live before provision hooks emit.

## Force-Activating and Tearing Down

A plugin that needs to act on a service even when nothing injected it returns `true` from `participates(token)`; the
container then force-activates that binding at provision and hands the instance to `onProvision`. Register teardown with
`addDisposer`. Disposers run in reverse order at deprovision and are **failsafe** (a throw never aborts teardown).

```ts
import { Container, WirestatePlugin, ServiceToken } from "@wirestate/core";

class PersistencePlugin implements WirestatePlugin {
  public participates(token: ServiceToken): boolean {
    return token === CartService;
  }

  public onProvision(instance: object, _container: Container, addDisposer: (dispose: () => void) => void): void {
    const cart = instance as CartService;

    cart.hydrate(loadFromStorage());
    addDisposer(() => saveToStorage(cart.snapshot()));
  }
}
```

Setup hooks (`install`, `onActivate`, `onProvision`, `onContainerProvision`) are **atomic**: a throw unwinds the current
construction, activation, or provision cycle. Teardown hooks and disposers are **failsafe**: a throw is swallowed and
teardown continues. Plugin teardown failures are not routed to the container error handler.

## Inheritance

Plugins resolve up the parent chain, nearest container first. One registered on the root container reaches the whole
subtree. A single devtools plugin observes every nested container, and an inherited messaging plugin wires a child
service's handler onto the ancestor's bus.

Plugins that declare `handles` can be shadowed by a nearer plugin that claims the same kind. This is how a child
container with its own `EventsPlugin`, `CommandsPlugin`, or `QueriesPlugin` gets a local bus. Observer plugins that do
not declare `handles` are not shadowed, so ancestors keep observing descendants.

## API Reference

[`WirestatePlugin`](/api/wirestate-core/interfaces/WirestatePlugin),
[`EventsPlugin`](/api/wirestate-core/classes/EventsPlugin),
[`CommandsPlugin`](/api/wirestate-core/classes/CommandsPlugin),
[`QueriesPlugin`](/api/wirestate-core/classes/QueriesPlugin),
[`Container`](/api/wirestate-core/classes/Container).
