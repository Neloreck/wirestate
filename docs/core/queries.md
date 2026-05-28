# Core Queries

Queries read data owned elsewhere. A query has one active handler and returns that handler's result.

Each query type uses a stack of handlers. The newest registration answers. When it unregisters, the previous handler is
active again.

## Handle A Query

```ts
import { Injectable, OnQuery } from "@wirestate/core";

@Injectable()
export class CartSummaryService {
  private items: Array<{ price: number }> = [];

  @OnQuery("CHECKOUT_SUMMARY")
  public checkoutSummary(): { itemCount: number; total: number } {
    return {
      itemCount: this.items.length,
      total: this.items.reduce((sum, item) => sum + item.price, 0),
    };
  }
}
```

## Run A Query

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class HeaderCartService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public getCheckoutSummary(): { itemCount: number; total: number } {
    return this.scope.queryData("CHECKOUT_SUMMARY");
  }
}
```

Choose the query call by return shape:

- `queryData` returns the handler result as-is.
- `queryDataAsync` always returns a Promise.
- `queryOptionalData` returns `null` if no handler exists.
- `queryOptionalDataAsync` combines optional lookup and Promise wrapping.

Use an async variant when the handler may return a Promise, so callers can always `await` the result without checking
whether the handler is sync or async.

## Register Directly

```ts
import { QueryBus, createContainer } from "@wirestate/core";

const container = createContainer();
const bus = container.get(QueryBus);

const unregister = bus.register("CURRENT_USER", () => ({ id: "u1" }));
const user = bus.query<{ id: string }>("CURRENT_USER");

unregister();
```

## Register From A Service

When a service owns a dynamic query handler, register it during provider lifecycle and unregister it during deprovision.

```ts
import { Inject, Injectable, OnDeprovision, OnProvision, QueryUnregister, WireScope } from "@wirestate/core";

@Injectable()
export class ShippingQuoteQueryService {
  private unregisterShippingQuote: QueryUnregister | null = null;
  private quote = { etaDays: 3, price: 12 };

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    this.unregisterShippingQuote = this.scope.registerQueryHandler("SHIPPING_QUOTE", () => this.quote);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unregisterShippingQuote?.();
    this.unregisterShippingQuote = null;
  }
}
```

Use this pattern when the query handler depends on runtime state or cannot be expressed with `@OnQuery`.

## API Reference

[`QueryBus`](/api/wirestate-core/classes/QueryBus), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`OnQuery`](/api/wirestate-core/functions/OnQuery), [`QueryHandler`](/api/wirestate-core/type-aliases/QueryHandler),
[`QueryUnregister`](/api/wirestate-core/type-aliases/QueryUnregister).
