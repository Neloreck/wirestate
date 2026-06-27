# React Queries

Query hooks let React components ask the active container for data and register handlers while the component is mounted.

Query execution can resolve services and run user handlers. Avoid calling query executors directly during render; call
them from an effect, event handler, or memoized callback and render cached component state.

## Register the Plugin

These hooks use the active container's `QueryBus`, which exists only when `QueriesPlugin` is registered in your provider's
`config.plugins`. See [React Containers > Messaging](/react/containers#messaging).

## Execute a Query

```tsx
import { useQueryExecutor } from "@wirestate/react";
import { useEffect, useState } from "react";

interface CheckoutSummary {
  itemCount: number;
  total: number;
}

function CheckoutSummaryBadge() {
  const query = useQueryExecutor();
  const [summary, setSummary] = useState<CheckoutSummary>({ itemCount: 0, total: 0 });

  useEffect(() => {
    setSummary(query<CheckoutSummary>("CHECKOUT_SUMMARY"));
  }, [query]);

  return <span>{summary.itemCount} items</span>;
}
```

## Async and Optional Executors

Choose the hook by return shape, then pass `{ optional: true }` for a lenient lookup:

- `useQueryExecutor` returns the handler result as-is.
- `useQueryExecutorAsync` always returns a Promise.
- Pass a literal `{ optional: true }` to either so a missing handler returns `undefined` instead of throwing.

Use an async variant when the handler may return a Promise. Callers can then always `await` the result without checking
whether the handler is sync or async.

```tsx
import { useQueryExecutor } from "@wirestate/react";
import { useCallback, useState } from "react";

interface ShippingQuote {
  etaDays: number;
  price: number;
}

function ShippingQuoteButton() {
  const query = useQueryExecutor();
  const [quote, setQuote] = useState<ShippingQuote | null>(null);

  const refreshQuote = useCallback(() => {
    setQuote(query<ShippingQuote>("SHIPPING_QUOTE", undefined, { optional: true }) ?? null);
  }, [query]);

  return <button onClick={refreshQuote}>{quote ? `$${quote.price}` : "Check shipping"}</button>;
}
```

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

Handlers unregister when the component unmounts or the active container changes. If several handlers use the same query
type, the newest one handles the query.

## API Reference

[`useQueryExecutor`](/api/wirestate-react/functions/useQueryExecutor),
[`useQueryExecutorAsync`](/api/wirestate-react/functions/useQueryExecutorAsync),
[`QueryExecutor`](/api/wirestate-react/interfaces/QueryExecutor),
[`QueryExecutorAsync`](/api/wirestate-react/interfaces/QueryExecutorAsync),
[`QueryDispatchOptions`](/api/wirestate-core/interfaces/QueryDispatchOptions),
[`useOnQuery`](/api/wirestate-react/functions/useOnQuery).
