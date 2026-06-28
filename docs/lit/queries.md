# Lit Queries

Query helpers let Lit elements register query handlers on the active container while the element is connected.

## Register the Plugin

These helpers use the active container's `QueryBus`, which exists only when `QueriesPlugin` is registered in the
provider's `config.plugins`. See [Lit Containers > Messaging](/lit/containers#messaging).

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

The handler registers when the element connects, unregisters when it disconnects, and moves to the new bus when the
nearest container context changes.

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

Inject `QueryBus` when an element needs to run queries. Run queries from an event handler or a `@state`-backed method,
not from `render()`. Query execution can resolve services and run user handlers.

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

Use `queryAsync` when callers need Promise-normalized results, and pass a literal `{ optional: true }` to `query` or
`queryAsync` when a missing handler is valid.

The optional call returns `undefined` instead of throwing when no handler is registered.

If the `QueryBus` itself may be absent (no `QueriesPlugin` registered in the active container chain), inject it
optionally with `@injection({ token: QueryBus, optional: true })` and guard before calling.

Query handlers are stack-based. If several connected elements register the same query type, the newest active handler
answers the query. When that element disconnects or moves to another container, the previous handler becomes active
again. See [Core Queries](/core/queries).

## API Reference

[`onQuery`](/api/wirestate-lit/functions/onQuery),
[`useOnQuery`](/api/wirestate-lit/functions/useOnQuery),
[`OnQueryController`](/api/wirestate-lit/classes/OnQueryController),
[`QueryBus`](/api/wirestate-core/classes/QueryBus),
[`QueryDispatchOptions`](/api/wirestate-core/interfaces/QueryDispatchOptions).
