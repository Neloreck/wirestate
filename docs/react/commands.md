# React Commands

A React component sends commands by injecting the active container's `CommandBus`, and registers handlers while the
component is mounted with `useOnCommand`.

## Register the Plugin

Commands use the active container's `CommandBus`, which exists only when `CommandsPlugin` is registered in your
provider's `config.plugins`. See [React Containers > Messaging](/react/containers#messaging).

## Execute a Command

Inject the `CommandBus` with `useInjection` and call `execute`. It returns the handler result synchronously and throws
when no handler exists.

```tsx
import { CommandBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";

function AddItemButton({ item }: { item: CartItem }) {
  const commandBus = useInjection(CommandBus);

  return (
    <button
      onClick={() => {
        const itemCount: number = commandBus.execute("ADD_CART_ITEM", item);

        console.info("Cart item count:", itemCount);
      }}
    >
      Add item
    </button>
  );
}
```

The injected bus is stable while the active container is unchanged, so it is safe to use in a `useCallback` or effect
dependency list.

## Execute an Async Command

Use `executeAsync` when the handler may return a Promise, or when the component should always work in an async way — it
always resolves to a Promise.

```tsx
import { CommandBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";
import { useCallback, useState } from "react";

function LogoutButton() {
  const commandBus = useInjection(CommandBus);
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    setPending(true);

    try {
      await commandBus.executeAsync("LOGOUT");
    } finally {
      setPending(false);
    }
  }, [commandBus]);

  return (
    <button disabled={pending} onClick={() => void logout()}>
      Log out
    </button>
  );
}
```

## Execute Optional Commands

When a command handler may be absent in some containers, pass a literal `{ optional: true }` so a missing handler
returns `undefined` instead of throwing.

```tsx
import { CommandBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";

function DevtoolsButtons() {
  const commandBus = useInjection(CommandBus);

  return (
    <>
      <button onClick={() => commandBus.execute("TOGGLE_DEVTOOLS", undefined, { optional: true })}>
        Toggle devtools
      </button>
      <button onClick={() => void commandBus.executeAsync("EXPORT_DEVTOOLS_TRACE", undefined, { optional: true })}>
        Export trace
      </button>
    </>
  );
}
```

If the `CommandBus` itself may be absent (no `CommandsPlugin` registered), resolve it optionally with
`useInjection(CommandBus, { optional: true })` and guard before calling.

## Handle a Command

```tsx
import { useOnCommand } from "@wirestate/react";
import { useState } from "react";

function SearchPanel() {
  const [open, setOpen] = useState(false);

  useOnCommand("OPEN_SEARCH", () => setOpen(true));

  return open ? <div>Search</div> : null;
}
```

Handlers unregister when the component unmounts or the active container changes. If several handlers use the same
command type, the newest one handles the command.

## API Reference

[`CommandBus`](/api/wirestate-core/classes/CommandBus),
[`CommandDispatchOptions`](/api/wirestate-core/interfaces/CommandDispatchOptions),
[`useInjection`](/api/wirestate-react/functions/useInjection),
[`useOnCommand`](/api/wirestate-react/functions/useOnCommand).
