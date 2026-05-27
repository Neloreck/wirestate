# React Queries

React query hooks dispatch queries and register component-lifetime query handlers on the active container.

## Execute A Query

```tsx
import { useQueryExecutor } from "@wirestate/react";

function ThemeButton() {
  const query = useQueryExecutor();

  return <button>Theme: {query<string>("CURRENT_THEME")}</button>;
}
```

## Async And Optional Executors

Choose the hook by return shape:

- `useQueryExecutor` returns the handler result as-is.
- `useAsyncQueryExecutor` always returns a Promise.
- `useOptionalQueryExecutor` returns `null` when no handler exists.
- `useOptionalAsyncQueryExecutor` combines optional lookup and Promise wrapping.

```tsx
import { useOptionalQueryExecutor } from "@wirestate/react";

function OptionalTheme() {
  const query = useOptionalQueryExecutor();
  const theme = query<string>("CURRENT_THEME");

  return <span>{theme ?? "default"}</span>;
}
```

## Handle A Query

```tsx
import { useQueryHandler } from "@wirestate/react";

function ThemeProvider() {
  useQueryHandler("CURRENT_THEME", () => "dark");

  return null;
}
```

Handlers unregister when the component unmounts or the active container changes. Newer handlers shadow older handlers
for the same query type.

## API Reference

[`useQueryExecutor`](/api/wirestate/functions/useQueryExecutor),
[`useAsyncQueryExecutor`](/api/wirestate/functions/useAsyncQueryExecutor),
[`useOptionalQueryExecutor`](/api/wirestate/functions/useOptionalQueryExecutor),
[`useOptionalAsyncQueryExecutor`](/api/wirestate/functions/useOptionalAsyncQueryExecutor),
[`useQueryHandler`](/api/wirestate/functions/useQueryHandler).
