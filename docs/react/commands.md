# React Commands

React command hooks dispatch commands and register component-lifetime command handlers on the active container.

## Execute A Command

```tsx
import { useCommandExecutor } from "@wirestate/react";

function LogoutButton() {
  const executeCommand = useCommandExecutor();

  return <button onClick={() => void executeCommand("LOGOUT").result}>Log out</button>;
}
```

`useCommandExecutor` throws through the core command bus when no handler exists.

## Execute Optional Commands

```tsx
import { useOptionalCommandExecutor } from "@wirestate/react";

function RefreshButton() {
  const executeOptionalCommand = useOptionalCommandExecutor();

  return (
    <button
      onClick={() => {
        void executeOptionalCommand("REFRESH_DEVTOOLS")?.result;
      }}
    >
      Refresh
    </button>
  );
}
```

## Handle A Command

```tsx
import { useCommandHandler } from "@wirestate/react";
import { useState } from "react";

function SearchPanel() {
  const [open, setOpen] = useState(false);

  useCommandHandler("OPEN_SEARCH", () => setOpen(true));

  return open ? <div>Search</div> : null;
}
```

Handlers unregister when the component unmounts or the active container changes. Newer handlers shadow older handlers
for the same command type.

## API Reference

[`useCommandExecutor`](/api/wirestate-react/functions/useCommandExecutor),
[`useOptionalCommandExecutor`](/api/wirestate-react/functions/useOptionalCommandExecutor),
[`useCommandHandler`](/api/wirestate-react/functions/useCommandHandler).
