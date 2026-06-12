# React Injection

Injection hooks let React components read services and values from the active container.

## Required Injection

Use [`useInjection`](/api/wirestate-react/functions/useInjection) when the value must exist.

```tsx
import { useInjection } from "@wirestate/react";
import { CounterService } from "./CounterService";

export function Counter() {
  const counter = useInjection(CounterService);

  return <button onClick={() => counter.increment()}>Increment</button>;
}
```

`useInjection` throws when the token cannot be resolved.

## Optional Injection

Use `useOptionalInjection` when a missing value is valid.

```tsx
import { useOptionalInjection } from "@wirestate/react";

function Diagnostics() {
  const logger = useOptionalInjection(LoggerService);

  return <span>{logger ? "Logging enabled" : "Logging disabled"}</span>;
}
```

You can provide a fallback resolver.

```tsx
const logger = useOptionalInjection(FileLogger, (container) => container.get(ConsoleLogger));
```

## Container

`useContainer` returns the active container. Use it when a component needs container-level operations.

```tsx
import { useContainer } from "@wirestate/react";

function DebugFlag() {
  const container = useContainer();

  return <span>{String(container.has(DebugService))}</span>;
}
```

## Scope

`useScope` returns the `WireScope` bound in the active container. Use it for events, commands, queries, seeds, or lazy
resolution.

```tsx
import { useScope } from "@wirestate/react";

function DebugButton() {
  const scope = useScope();

  return <button onClick={() => scope.emitEvent("DEBUG_CLICKED")}>Debug</button>;
}
```

## API Reference

[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useOptionalInjection`](/api/wirestate-react/functions/useOptionalInjection),
[`useContainer`](/api/wirestate-react/functions/useContainer),
[`useScope`](/api/wirestate-react/functions/useScope).
