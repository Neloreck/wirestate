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

Use `optionalInjection` when a missing value is valid.

```ts
import { optionalInjection } from "@wirestate/lit";

class DiagnosticsPanel extends LitElement {
  @optionalInjection(LoggerService)
  private logger: LoggerService | null = null;
}
```

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

`useContainer` and `useScope` expose the active container and `WireScope`.

```ts
import { useScope } from "@wirestate/lit";

class DebugButton extends LitElement {
  private readonly scope = useScope(this);

  private emitDebug(): void {
    this.scope.value.emitEvent("DEBUG_CLICKED");
  }
}
```

## API Reference

[`injection`](/api/wirestate-lit/functions/injection),
[`optionalInjection`](/api/wirestate-lit/functions/optionalInjection), [`useInjection`](/api/wirestate-lit/functions/useInjection),
[`useOptionalInjection`](/api/wirestate-lit/functions/useOptionalInjection), [`useContainer`](/api/wirestate-lit/functions/useContainer),
[`useScope`](/api/wirestate-lit/functions/useScope).
