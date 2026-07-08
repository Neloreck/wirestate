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

Pass `optional` when a missing binding is valid - the hook returns `undefined` instead of throwing when the token is
not bound. It still throws when the component is not rendered under a `<ContainerProvider>`: `optional` covers an
unbound token, not a missing container.

```tsx
import { useInjection } from "@wirestate/react";

function Diagnostics() {
  const logger = useInjection(LoggerService, { optional: true });

  return <span>{logger ? "Logging enabled" : "Logging disabled"}</span>;
}
```

Provide a `fallback`, which implies `optional`, for the unbound case. The fallback can be a raw value or a
`(container) => value` factory.

```tsx
// Raw value: used as-is when the token is not bound.
const name = useInjection(UserName, { fallback: "guest" });

// Factory: lazy, receives the container, runs only when the token is missing.
const logger = useInjection(FileLogger, { fallback: (container) => container.get(ConsoleLogger) });
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

## Messaging

Injection also resolves the message buses. To send, inject the bus and call it
(`useInjection(CommandBus).execute(...)`). To subscribe, use the lifecycle-managed `useOnCommand` / `useOnQuery` /
`useOnEvents` hooks. See [Commands](/react/commands), [Queries](/react/queries), and [Events](/react/events).

## API Reference

[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useContainer`](/api/wirestate-react/functions/useContainer).
