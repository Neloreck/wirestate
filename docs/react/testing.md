# React Testing

Test services with `Container`. Use `ContainerProvider` when a component needs a Wirestate provider.

## Render with a Container

```tsx
import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { Counter } from "./Counter";
import { CounterService } from "./CounterService";

test("renders count", () => {
  const container = new Container({ bindings: [CounterService], activate: true });

  const { getByText } = render(
    <ContainerProvider container={container}>
      <Counter />
    </ContainerProvider>
  );

  expect(getByText("Count: 0")).toBeInTheDocument();
});
```

## Test Hook Handlers Through UI

Command, query, and event hooks register against the active container. Render the component with a container, then drive
the behavior through user events or the container bus.

```tsx
import { CommandBus, CommandsPlugin, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { render } from "@testing-library/react";

test("opens search from command", async () => {
  const container = new Container({ plugins: [new CommandsPlugin()] });

  const { findByText } = render(
    <ContainerProvider container={container}>
      <SearchPanel />
    </ContainerProvider>
  );

  container.get(CommandBus).execute("OPEN_SEARCH");

  expect(await findByText("Search")).toBeInTheDocument();
});
```

For async command handlers, use the async bus method so the test waits for the handler.

```tsx
import { CommandBus, CommandsPlugin, Container } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { render, screen } from "@testing-library/react";

test("saves draft from command", async () => {
  const container = new Container({ plugins: [new CommandsPlugin()] });

  render(
    <ContainerProvider container={container}>
      <DraftEditor />
    </ContainerProvider>
  );

  await container.get(CommandBus).executeAsync("SAVE_DRAFT");

  expect(await screen.findByText("Saved")).toBeInTheDocument();
});
```

## API Reference

[`ContainerProvider`](/api/wirestate-react/functions/ContainerProvider),
[`Container`](/api/wirestate-core/classes/Container).
