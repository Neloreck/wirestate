# React Queries

React query hooks dispatch queries and register component-lifetime query handlers on the active container.

Query execution can resolve services and run user handlers. Avoid calling query executors directly during render; call
them from an effect, event handler, or memoized callback and render cached component state.

## Execute A Query

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

## Async And Optional Executors

Choose the hook by return shape:

- `useQueryExecutor` returns the handler result as-is.
- `useAsyncQueryExecutor` always returns a Promise.
- `useOptionalQueryExecutor` returns `null` when no handler exists.
- `useOptionalAsyncQueryExecutor` combines optional lookup and Promise wrapping.

Use an async variant when the handler may return a Promise, so callers can always `await` the result without checking
whether the handler is sync or async.

```tsx
import { useOptionalQueryExecutor } from "@wirestate/react";
import { useCallback, useState } from "react";

interface ShippingQuote {
  etaDays: number;
  price: number;
}

function ShippingQuoteButton() {
  const query = useOptionalQueryExecutor();
  const [quote, setQuote] = useState<ShippingQuote | null>(null);

  const refreshQuote = useCallback(() => {
    setQuote(query<ShippingQuote>("SHIPPING_QUOTE"));
  }, [query]);

  return <button onClick={refreshQuote}>{quote ? `$${quote.price}` : "Check shipping"}</button>;
}
```

## Handle A Query

```tsx
import { useQueryHandler } from "@wirestate/react";

function CheckoutQueries(props: { cart: Array<{ price: number }> }) {
  useQueryHandler("CHECKOUT_SUMMARY", () => ({
    itemCount: props.cart.length,
    total: props.cart.reduce((sum, item) => sum + item.price, 0),
  }));

  return null;
}
```

Handlers unregister when the component unmounts or the active container changes. Newer handlers shadow older handlers
for the same query type.

## API Reference

[`useQueryExecutor`](/api/wirestate-react/functions/useQueryExecutor),
[`useAsyncQueryExecutor`](/api/wirestate-react/functions/useAsyncQueryExecutor),
[`useOptionalQueryExecutor`](/api/wirestate-react/functions/useOptionalQueryExecutor),
[`useOptionalAsyncQueryExecutor`](/api/wirestate-react/functions/useOptionalAsyncQueryExecutor),
[`useQueryHandler`](/api/wirestate-react/functions/useQueryHandler).
