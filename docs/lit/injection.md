# Lit Injection

Injection helpers let Lit elements read services and values from the nearest Wirestate container.

## Decorator Injection

```ts
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { CartService } from "./CartService";

@customElement("cart-icon")
export class CartIcon extends LitElement {
  @injection(CartService)
  private cart!: CartService;

  protected render() {
    return html`<span>${this.cart.items.length}</span>`;
  }
}
```

By default, the property follows the nearest container context. Pass `once: true` when the first resolved value should
stay fixed.

```ts
@injection({ token: CartService, once: true })
private cart!: CartService;
```

## Optional Injection

Pass `optional` when a missing value is valid - the property is assigned `undefined` instead of throwing.

```ts
import { injection } from "@wirestate/lit";

class DiagnosticsPanel extends LitElement {
  @injection({ token: LoggerService, optional: true })
  private logger?: LoggerService;
}
```

Provide a `fallback` - which implies `optional` - for the unbound case, either a raw value or a `(container) => value` factory.

```ts
class DiagnosticsPanel extends LitElement {
  // Raw value: used as-is when the token is not bound.
  @injection({ token: UserName, fallback: "guest" })
  private name: string = "guest";

  // Factory: lazy, receives the container, runs only when the token is missing.
  @injection({ token: FileLogger, fallback: (container) => container.get(ConsoleLogger) })
  private logger?: Logger;
}
```

The same `optional` and `fallback` options work on the `useInjection` controller helper.

## Controller Helpers

`useInjection` returns a mutable holder. Read `holder.value` in element methods and templates.

```ts
import { useInjection } from "@wirestate/lit";

class CartIcon extends LitElement {
  private readonly cart = useInjection(this, CartService);

  protected render() {
    return html`<span>${this.cart.value.items.length}</span>`;
  }
}
```

`useContainer` exposes the active container for container-level operations.

```ts
import { Container } from "@wirestate/core";
import { useContainer } from "@wirestate/lit";

class DebugPanel extends LitElement {
  private readonly container = useContainer(this);

  private hasDebug(): boolean {
    return this.container.value.has("DEBUG");
  }
}
```

To emit events, execute commands, or run queries from an element, inject the bus you need with `useInjection` (or the
`injection` decorator) and register that bus's plugin in the provider's `config.plugins` (`new EventsPlugin()`,
`new CommandsPlugin()`, or `new QueriesPlugin()`).

```ts
import { EventBus } from "@wirestate/core";
import { useInjection } from "@wirestate/lit";

class DebugButton extends LitElement {
  private readonly events = useInjection(this, EventBus);

  private emitDebug(): void {
    this.events.value.emit("DEBUG_CLICKED");
  }
}
```

## API Reference

[`injection`](/api/wirestate-lit/functions/injection), [`useInjection`](/api/wirestate-lit/functions/useInjection),
[`useContainer`](/api/wirestate-lit/functions/useContainer).
