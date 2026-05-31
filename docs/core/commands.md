# Core Commands

Commands trigger work. A command has one active handler. Use the synchronous APIs when the handler is synchronous
and the caller needs the result immediately. Use the async APIs when the handler may return a Promise or the caller wants
a Promise-normalized result.

Each command type uses a stack of handlers. The newest registration wins. When it unregisters, the previous handler is
active again.

## Handle A Command

```ts
import { Injectable, OnCommand } from "@wirestate/core";

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

## Execute A Command

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class HeaderService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public openSearch(): void {
    const opened: boolean = this.scope.executeCommand("OPEN_SEARCH");

    if (!opened) {
      console.error("Failed to open search")
    }
  }
}
```

`executeCommand` throws `WirestateError` when no handler exists.

## Handle An Async Command

```ts
import { Inject, Injectable, OnCommand, WireScope } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async logout(): Promise<void> {
    await revokeSession();
  }
}

@Injectable()
export class HeaderService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public async logout(): Promise<void> {
    await this.scope.executeCommandAsync("LOGOUT");
  }
}
```

`executeCommandAsync` wraps synchronous handler results and passes asynchronous results through.

## Execute Optional Commands

Use optional commands when absence is normal, such as an optional devtools integration.

```ts
const refreshed: boolean | null = this.scope.executeOptionalCommand("REFRESH_DEVTOOLS");

const uploaded: UploadReceipt | null = await this.scope.executeOptionalCommandAsync("UPLOAD_DRAFT", draft);
```

## Register Directly

```ts
import { CommandBus, createContainer } from "@wirestate/core";

const container = createContainer();
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

## Register From A Service

When a service owns a dynamic command handler, register it during provider lifecycle and unregister it during
deprovision.

```ts
import { CommandUnregister, Inject, Injectable, OnDeprovision, OnProvision, WireScope } from "@wirestate/core";

@Injectable()
export class CartCommandService {
  private unregisterSaveCart: CommandUnregister | null = null;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    this.unregisterSaveCart = this.scope.registerCommandHandler("SAVE_CART", async (cart: Cart) => {
      await this.saveCart(cart);
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unregisterSaveCart?.();
    this.unregisterSaveCart = null;
  }

  private async saveCart(cart: Cart): Promise<void> {
    await saveCart(cart);
  }
}
```

Use this pattern when the command handler depends on runtime state or cannot be expressed with `@OnCommand`.

## API Reference

[`CommandBus`](/api/wirestate-core/classes/CommandBus), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`OnCommand`](/api/wirestate-core/functions/OnCommand),
[`CommandUnregister`](/api/wirestate-core/type-aliases/CommandUnregister).
