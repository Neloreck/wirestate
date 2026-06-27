# React Queries

A React component runs queries by injecting the active container's `QueryBus`, and registers handlers while the
component is mounted with `useOnQuery`.

Query execution can resolve services and run user handlers. Avoid querying directly during render; do it from an effect,
event handler, or memoized callback and render cached component state.

## Register the Plugin

Queries use the active container's `QueryBus`, which exists only when `QueriesPlugin` is registered in your provider's
`config.plugins`. See [React Containers > Messaging](/react/containers#messaging).

## Execute a Query

Inject the `QueryBus` with `useInjection` and call `query`.

```tsx
import { QueryBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";
import { useEffect, useState } from "react";

interface CheckoutSummary {
  itemCount: number;
  total: number;
}

function CheckoutSummaryBadge() {
  const queryBus = useInjection(QueryBus);
  const [summary, setSummary] = useState<CheckoutSummary>({ itemCount: 0, total: 0 });

  useEffect(() => {
    setSummary(queryBus.query<CheckoutSummary>("CHECKOUT_SUMMARY"));
  }, [queryBus]);

  return <span>{summary.itemCount} items</span>;
}
```

The injected bus is stable while the active container is unchanged, so it is safe to use in a `useCallback` or effect
dependency list.

## Async and Optional Queries

Choose the method by return shape, then pass `{ optional: true }` for a lenient lookup:

- `query` returns the handler result as-is.
- `queryAsync` always returns a Promise.
- Pass a literal `{ optional: true }` to either so a missing handler returns `undefined` instead of throwing.

Use `queryAsync` when the handler may return a Promise. Callers can then always `await` the result without checking
whether the handler is sync or async.

```tsx
import { QueryBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";
import { useCallback, useState } from "react";

interface ShippingQuote {
  etaDays: number;
  price: number;
}

function ShippingQuoteButton() {
  const queryBus = useInjection(QueryBus);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);

  const refreshQuote = useCallback(() => {
    setQuote(queryBus.query<ShippingQuote>("SHIPPING_QUOTE", undefined, { optional: true }) ?? null);
  }, [queryBus]);

  return <button onClick={refreshQuote}>{quote ? `$${quote.price}` : "Check shipping"}</button>;
}
```

If the `QueryBus` itself may be absent (no `QueriesPlugin` registered), resolve it optionally with
`useInjection(QueryBus, { optional: true })` and guard before calling.

## Handle a Query

```tsx
import { useOnQuery } from "@wirestate/react";

function CheckoutQueries(props: { cart: Array<{ price: number }> }) {
  useOnQuery("CHECKOUT_SUMMARY", () => ({
    itemCount: props.cart.length,
    total: props.cart.reduce((sum, item) => sum + item.price, 0),
  }));

  return null;
}
```

Handlers unregister when the component unmounts, the query type changes, or the active container changes. The hook keeps
the latest handler without re-registering. If several handlers use the same query type, the newest one handles the
query.

## API Reference

[`QueryBus`](/api/wirestate-core/classes/QueryBus),
[`QueryDispatchOptions`](/api/wirestate-core/interfaces/QueryDispatchOptions),
[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useOnQuery`](/api/wirestate-react/functions/useOnQuery).
