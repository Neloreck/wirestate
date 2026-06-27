# Core Queries

Queries are request/response messages for read-oriented work: current user, labels, cached state, etc.

Each query type has one active handler. Registering another handler for the same type shadows the previous one. When
the newest handler unregisters, the previous handler becomes active again.

Use required queries when a missing handler is an error. Use optional queries when a missing handler is valid.

## Register the Plugin

The query bus is opt-in. Register `QueriesPlugin` on the container so `inject(QueryBus)`, direct registration, and
`@OnQuery` handlers work. A service that declares `@OnQuery` throws at provision unless `QueriesPlugin` is registered
somewhere in the container chain.

```ts
import { Container, QueriesPlugin } from "@wirestate/core";

const container = new Container({
  bindings: [CartSummaryService],
  plugins: [new QueriesPlugin()],
});
```

See [Core Plugins](/core/plugins) for inheritance and registering the plugin on a parent container.

## Handle a Query

Use `@OnQuery(type)` when an injectable service owns the handler. The handler is registered when the container is
provisioned and unregistered when the provision cycle ends.

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

One query call goes to one handler. The method receives the optional payload and returns the query result.

## Run Required Queries

`query` returns the active handler result as-is. If the handler returns a Promise, `query` returns that Promise.
`query` throws `WirestateError` when no handler is registered.

```ts
import { Injectable, QueryBus, inject } from "@wirestate/core";

@Injectable()
export class HeaderCartService {
  public constructor(private readonly queries: QueryBus = inject(QueryBus)) {}

  public getCheckoutSummary(): { itemCount: number; total: number } {
    return this.queries.query("CHECKOUT_SUMMARY");
  }
}
```

Use `queryAsync` when the caller should always receive a Promise. It wraps synchronous handler results and passes
Promise results through.

```ts
const summary = await this.queries.queryAsync<{ itemCount: number; total: number }>("CHECKOUT_SUMMARY");
```

## Run Optional Queries

Use optional execution when a missing handler is valid. Pass a literal `{ optional: true }` so a missing handler returns
`undefined` instead of throwing.

```ts
const featureFlags = this.queries.query<FeatureFlags>("FEATURE_FLAGS", undefined, { optional: true });

const remoteProfile = await this.queries.queryAsync<UserProfile, string>("REMOTE_PROFILE", userId, { optional: true });
```

## Register Directly

Use `QueryBus.register` when the handler is not a service method or needs a shorter lifetime than provider
provisioning. The returned callback removes that exact registration.

```ts
import { Container, QueriesPlugin, QueryBus } from "@wirestate/core";

const container = new Container({ plugins: [new QueriesPlugin()] });
const bus = container.get(QueryBus);

const unregister = bus.register("CURRENT_USER", () => ({ id: "u1" }));
const user = bus.query<{ id: string }>("CURRENT_USER");

unregister();
```

## Register from a Service

When a service owns a dynamic query handler, register it during provider lifecycle and unregister it during
deprovision. Use this pattern when the handler depends on runtime state or cannot be expressed with `@OnQuery`.

```ts
import { Injectable, OnDeprovision, OnProvision, QueryBus, QueryUnregister, inject } from "@wirestate/core";

@Injectable()
export class ShippingQuoteQueryService {
  private unregisterShippingQuote: QueryUnregister = () => void 0;
  private quote = { etaDays: 3, price: 12 };

  public constructor(private readonly queries: QueryBus = inject(QueryBus)) {}

  @OnProvision()
  public onProvision(): void {
    this.unregisterShippingQuote = this.queries.register("SHIPPING_QUOTE", () => this.quote);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unregisterShippingQuote();
    this.unregisterShippingQuote = () => void 0;
  }
}
```

## API Reference

[`QueryBus`](/api/wirestate-core/classes/QueryBus), [`QueriesPlugin`](/api/wirestate-core/classes/QueriesPlugin),
[`OnQuery`](/api/wirestate-core/functions/OnQuery), [`QueryType`](/api/wirestate-core/type-aliases/QueryType),
[`QueryHandler`](/api/wirestate-core/type-aliases/QueryHandler),
[`QueryDispatchOptions`](/api/wirestate-core/interfaces/QueryDispatchOptions),
[`QueryUnregister`](/api/wirestate-core/type-aliases/QueryUnregister),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision).
