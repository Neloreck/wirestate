# Lit Queries

Query helpers let Lit elements register query handlers on the active container while the element is connected.

## Register the Plugin

These helpers use the active container's `QueryBus`, which exists only when `QueriesPlugin` is registered in the
provider's `config.plugins`. See [Lit Containers › Messaging](/lit/containers#messaging).

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

## Execute from an Element

Inject `QueryBus` when an element needs to run queries.

```ts
import { QueryBus } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("checkout-summary-button")
export class CheckoutSummaryButton extends LitElement {
  @injection(QueryBus)
  private queries!: QueryBus;

  @state()
  private itemCount: number = 0;

  private readSummary(): void {
    const summary = this.queries.query<{ itemCount: number; total: number }>("CHECKOUT_SUMMARY");

    this.itemCount = summary.itemCount;
  }

  protected render() {
    return html`<button @click=${() => this.readSummary()}>Items: ${this.itemCount}</button>`;
  }
}
```

If several handlers use the same query type, the newest one handles the query.

## API Reference

[`onQuery`](/api/wirestate-lit/functions/onQuery), [`useOnQuery`](/api/wirestate-lit/functions/useOnQuery),
[`OnQueryController`](/api/wirestate-lit/classes/OnQueryController).
