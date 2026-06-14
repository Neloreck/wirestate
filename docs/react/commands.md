# React Commands

Command hooks let React components send commands to the active container and register handlers while the component is
mounted.

## Register the Plugin

These hooks use the active container's `CommandBus`, which exists only when `CommandsPlugin` is registered in your
provider's `config.plugins`. See [React Containers › Messaging](/react/containers#messaging).

## Execute a Command

Use `useCommandExecutor` when the active handler is synchronous and the caller needs the result immediately.

```tsx
import { useCommandExecutor } from "@wirestate/react";

function AddItemButton({ item }: { item: CartItem }) {
  const executeCommand = useCommandExecutor();

  return (
    <button
      onClick={() => {
        const itemCount: number = executeCommand("ADD_CART_ITEM", item);

        console.info("Cart item count:", itemCount);
      }}
    >
      Add item
    </button>
  );
}
```

`useCommandExecutor` throws through the core command bus when no handler exists.

## Execute an Async Command

Use `useAsyncCommandExecutor` when the handler may return a Promise, or when
the component should always work in an async way.

```tsx
import { useAsyncCommandExecutor } from "@wirestate/react";
import { useCallback, useState } from "react";

function LogoutButton() {
  const executeCommandAsync = useAsyncCommandExecutor();
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    setPending(true);

    try {
      await executeCommandAsync("LOGOUT");
    } finally {
      setPending(false);
    }
  }, [executeCommandAsync]);

  return (
    <button disabled={pending} onClick={() => void logout()}>
      Log out
    </button>
  );
}
```

## Execute Optional Commands

Use optional executors when a command handler may be absent in some containers.

```tsx
import { useOptionalAsyncCommandExecutor, useOptionalCommandExecutor } from "@wirestate/react";

function DevtoolsButtons() {
  const executeOptionalCommand = useOptionalCommandExecutor();
  const executeOptionalCommandAsync = useOptionalAsyncCommandExecutor();

  return (
    <>
      <button onClick={() => executeOptionalCommand("TOGGLE_DEVTOOLS")}>Toggle devtools</button>
      <button onClick={() => void executeOptionalCommandAsync("EXPORT_DEVTOOLS_TRACE")}>Export trace</button>
    </>
  );
}
```

## Handle a Command

```tsx
import { useCommandHandler } from "@wirestate/react";
import { useState } from "react";

function SearchPanel() {
  const [open, setOpen] = useState(false);

  useCommandHandler("OPEN_SEARCH", () => setOpen(true));

  return open ? <div>Search</div> : null;
}
```

Handlers unregister when the component unmounts or the active container changes. If several handlers use the same
command type, the newest one handles the command.

## API Reference

[`useCommandExecutor`](/api/wirestate-react/functions/useCommandExecutor),
[`useAsyncCommandExecutor`](/api/wirestate-react/functions/useAsyncCommandExecutor),
[`useOptionalCommandExecutor`](/api/wirestate-react/functions/useOptionalCommandExecutor),
[`useOptionalAsyncCommandExecutor`](/api/wirestate-react/functions/useOptionalAsyncCommandExecutor),
[`useCommandHandler`](/api/wirestate-react/functions/useCommandHandler).
