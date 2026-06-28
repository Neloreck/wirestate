# Core Commands

Commands are imperative messages for write-oriented work: save, login, reset, submit, send, etc.

Each command type has one active handler. Registering another handler for the same type shadows the previous one. When
the newest handler unregisters, the previous handler becomes active again.

Use required execution when a missing handler is an error. Use optional execution when a missing handler is valid.

## Register the Plugin

The command bus is opt-in. Register `CommandsPlugin` on the container so `inject(CommandBus)`, direct registration, and
`@OnCommand` handlers work. A service that declares `@OnCommand` throws at provision unless `CommandsPlugin` is registered
somewhere in the container chain.

```ts
import { CommandsPlugin, Container } from "@wirestate/core";

const container = new Container({
  bindings: [SearchService],
  plugins: [new CommandsPlugin()],
});
```

See [Core Plugins](/core/plugins) for inheritance and registering the plugin on a parent container.

## Handle a Command

Use `@OnCommand(type)` when an injectable service owns the handler. The handler is registered when the container is
provisioned and unregistered when the provision cycle ends.

```ts
import { Injectable, OnCommand, inject } from "@wirestate/core";

@Injectable()
export class SearchService {
  private open: boolean = false;

  @OnCommand("OPEN_SEARCH")
  public openSearch(): boolean {
    this.open = true;

    return this.open;
  }
}
```

One command call goes to one handler. The method receives the optional payload and returns the command result.

## Execute Required Commands

`execute` returns the active handler result as-is. If the handler returns a Promise, `execute` returns that Promise.
`execute` throws `WirestateError` when no handler is registered.

```ts
import { CommandBus, Injectable, inject } from "@wirestate/core";

@Injectable()
export class HeaderService {
  public constructor(private readonly commands: CommandBus = inject(CommandBus)) {}

  public openSearch(): void {
    const opened: boolean = this.commands.execute<boolean>("OPEN_SEARCH");

    if (!opened) {
      console.error("Failed to open search");
    }
  }
}
```

Use `executeAsync` when the caller should always receive a Promise. It wraps synchronous handler results and passes
Promise results through.

```ts
import { CommandBus, Injectable, OnCommand, inject } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async logout(): Promise<void> {
    await revokeSession();
  }
}

@Injectable()
export class HeaderService {
  public constructor(private readonly commands: CommandBus = inject(CommandBus)) {}

  public async logout(): Promise<void> {
    await this.commands.executeAsync("LOGOUT");
  }
}
```

## Execute Optional Commands

Use optional execution when a missing handler is valid, such as an optional DevTools integration. Pass a literal
`{ optional: true }` so a missing handler returns `undefined` instead of throwing.

```ts
const refreshed = this.commands.execute<boolean>("REFRESH_DEVTOOLS", undefined, { optional: true });

const uploaded = await this.commands.executeAsync<UploadReceipt, Draft>("UPLOAD_DRAFT", draft, { optional: true });
```

## Register Directly

Use `CommandBus.register` when the handler is not a service method or needs a shorter lifetime than provider
provisioning. The returned callback removes that exact registration.

```ts
import { CommandBus, CommandsPlugin, Container } from "@wirestate/core";

const container = new Container({ plugins: [new CommandsPlugin()] });
const bus = container.get(CommandBus);

const unregister = bus.register("SAVE_CART", async (cart: Cart) => {
  await saveCart(cart);
});

await bus.executeAsync("SAVE_CART", cart);
unregister();
```

For synchronous handlers, use `execute` directly:

```ts
bus.register("RESET_CART", () => cart.clear());

bus.execute("RESET_CART");
```

## Register from a Service

When a service owns a dynamic command handler, register it during provider lifecycle and unregister it during
deprovision. Use this pattern when the handler depends on runtime state or cannot be expressed with `@OnCommand`.

```ts
import { CommandBus, CommandUnregister, Injectable, OnDeprovision, OnProvision, inject } from "@wirestate/core";

@Injectable()
export class CartCommandService {
  private unregisterSaveCart: CommandUnregister = () => void 0;

  public constructor(private readonly commands: CommandBus = inject(CommandBus)) {}

  @OnProvision()
  public onProvision(): void {
    this.unregisterSaveCart = this.commands.register("SAVE_CART", async (cart: Cart) => {
      await this.saveCart(cart);
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unregisterSaveCart();
    this.unregisterSaveCart = () => void 0;
  }

  private async saveCart(cart: Cart): Promise<void> {
    await saveCart(cart);
  }
}
```

## API Reference

[`CommandBus`](/api/wirestate-core/classes/CommandBus),
[`CommandsPlugin`](/api/wirestate-core/classes/CommandsPlugin),
[`OnCommand`](/api/wirestate-core/functions/OnCommand),
[`CommandType`](/api/wirestate-core/type-aliases/CommandType),
[`CommandHandler`](/api/wirestate-core/type-aliases/CommandHandler),
[`CommandDispatchOptions`](/api/wirestate-core/interfaces/CommandDispatchOptions),
[`CommandUnregister`](/api/wirestate-core/type-aliases/CommandUnregister),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision).
