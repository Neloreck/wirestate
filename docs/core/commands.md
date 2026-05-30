# Core Commands

Commands trigger write work. A command has one active handler and returns a `CommandExecution` with `status` and
`result`.

Each command type uses a stack of handlers. The newest registration wins. When it unregisters, the previous handler is
active again.

## Handle A Command

```ts
import { Injectable, OnCommand } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async logout(): Promise<void> {
    await revokeSession();
  }
}
```

## Execute A Command

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class HeaderService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public async logout(): Promise<void> {
    const execution = this.scope.executeCommand("LOGOUT");

    await execution.result;
  }
}
```

`executeCommand` throws `WirestateError` when no handler exists.

Use optional commands when absence is normal.

```ts
const execution = this.scope.executeOptionalCommand("REFRESH_DEVTOOLS");

if (execution) {
  await execution.result;
}
```

## Register Directly

```ts
import { CommandBus, createContainer } from "@wirestate/core";

const container = createContainer();
const bus = container.get(CommandBus);

const unregister = bus.register("SAVE_CART", async (cart: Cart) => {
  await saveCart(cart);
});

await bus.execute("SAVE_CART", cart).result;
unregister();
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
[`CommandExecution`](/api/wirestate-core/interfaces/CommandExecution),
[`CommandUnregister`](/api/wirestate-core/type-aliases/CommandUnregister).
