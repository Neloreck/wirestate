# Core Commands

Commands trigger work. A command has one active handler.

Use synchronous APIs when the handler is synchronous and the caller needs the result immediately. Use async APIs when the
handler may return a Promise or the caller should always receive a Promise.

Each command type uses a stack of handlers. The newest registration handles the command. When it unregisters, the
previous handler becomes active again.

## Handle a Command

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

## Execute a Command

```ts
import { Injectable, WireScope, inject } from "@wirestate/core";

@Injectable()
export class HeaderService {
  public constructor(private readonly scope: WireScope = inject(WireScope)) {}

  public openSearch(): void {
    const opened: boolean = this.scope.executeCommand("OPEN_SEARCH");

    if (!opened) {
      console.error("Failed to open search");
    }
  }
}
```

`executeCommand` throws `WirestateError` when no handler exists.

## Handle an Async Command

```ts
import { Injectable, OnCommand, WireScope, inject } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async logout(): Promise<void> {
    await revokeSession();
  }
}

@Injectable()
export class HeaderService {
  public constructor(private readonly scope: WireScope = inject(WireScope)) {}

  public async logout(): Promise<void> {
    await this.scope.executeCommandAsync("LOGOUT");
  }
}
```

`executeCommandAsync` wraps synchronous handler results in a Promise and passes asynchronous results through.

## Execute Optional Commands

Use optional commands when a missing handler is valid, such as an optional devtools integration.

```ts
const refreshed: boolean | null = this.scope.executeOptionalCommand("REFRESH_DEVTOOLS");

const uploaded: UploadReceipt | null = await this.scope.executeOptionalCommandAsync("UPLOAD_DRAFT", draft);
```

## Register Directly

```ts
import { CommandBus, Container } from "@wirestate/core";

const container = new Container();
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
deprovision.

```ts
import { CommandUnregister, Injectable, OnDeprovision, OnProvision, WireScope, inject } from "@wirestate/core";

@Injectable()
export class CartCommandService {
  private unregisterSaveCart: CommandUnregister | null = null;

  public constructor(private readonly scope: WireScope = inject(WireScope)) {}

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
