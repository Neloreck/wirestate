# React Injection

Use [`useInjection`](/api/wirestate/functions/useInjection) to resolve a service or value from the active container.

## Required Injection

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

Use `useOptionalInjection` when absence is expected.

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

`useContainer` returns the current container. Use it when a component needs container-level operations.

```tsx
import { useContainer } from "@wirestate/react";

function DebugFlag() {
  const container = useContainer();

  return <span>{String(container.isBound(DebugService))}</span>;
}
```

## Scope

`useScope` returns the `WireScope` bound in the current container. Use it for events, commands, queries, seeds, or lazy
resolution from a component.

```tsx
import { useScope } from "@wirestate/react";

function DebugButton() {
  const scope = useScope();

  return <button onClick={() => scope.emitEvent("DEBUG_CLICKED")}>Debug</button>;
}
```

## API Reference

[`useInjection`](/api/wirestate/functions/useInjection),
[`useOptionalInjection`](/api/wirestate/functions/useOptionalInjection), [`useContainer`](/api/wirestate/functions/useContainer),
[`useScope`](/api/wirestate/functions/useScope).
