# Lit Queries

Lit query helpers register query handlers against the active container while the element is connected.

## Decorator Handler

```ts
import { onQuery } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("checkout-answer")
export class CheckoutAnswer extends LitElement {
  @onQuery("CHECKOUT_SUMMARY")
  private checkoutSummary(): { itemCount: number; total: number } {
    return { itemCount: 2, total: 48 };
  }
}
```

## Controller Handler

```ts
import { useOnQuery } from "@wirestate/lit";
import { LitElement } from "lit";

class CheckoutAnswer extends LitElement {
  private readonly summaryQuery = useOnQuery(this, {
    type: "CHECKOUT_SUMMARY",
    handler: () => ({ itemCount: 2, total: 48 }),
  });
}
```

## Execute From An Element

```ts
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("checkout-summary-button")
export class CheckoutSummaryButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private itemCount: number = 0;

  private readSummary(): void {
    const summary = this.scope.queryData<{ itemCount: number; total: number }>("CHECKOUT_SUMMARY");

    this.itemCount = summary.itemCount;
  }

  protected render() {
    return html`<button @click=${() => this.readSummary()}>Items: ${this.itemCount}</button>`;
  }
}
```

Newer handlers shadow older handlers for the same query type.

## API Reference

[`onQuery`](/api/wirestate-lit/functions/onQuery), [`useOnQuery`](/api/wirestate-lit/functions/useOnQuery),
[`OnQueryController`](/api/wirestate-lit/classes/OnQueryController).
