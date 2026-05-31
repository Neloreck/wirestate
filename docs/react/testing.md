# React Testing

Use `createContainer` for services. Use `@wirestate/react/test-utils` when a component needs a Wirestate provider.

## Render With A Container

`withContainerProvider` wraps a React tree with a test container.

```tsx
import { render } from "@testing-library/react";
import { createContainer } from "@wirestate/core";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { Counter } from "./Counter";
import { CounterService } from "./CounterService";

test("renders count", () => {
  const container = createContainer({ bindings: [CounterService], activate: true });

  const { getByText } = render(withContainerProvider(<Counter />, container));

  expect(getByText("Count: 0")).toBeInTheDocument();
});
```

## Test Hook Handlers Through UI

Command, query, and event hooks register against the active container. Render the component under a container, then drive
the behavior through user events or the container bus.

```tsx
import { CommandBus, createContainer } from "@wirestate/core";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { render } from "@testing-library/react";

test("opens search from command", async () => {
  const container = createContainer();

  const { findByText } = render(withContainerProvider(<SearchPanel />, container));

  container.get(CommandBus).execute("OPEN_SEARCH");

  expect(await findByText("Search")).toBeInTheDocument();
});
```

For async command handlers, use the async bus method so the test waits for the handler to finish.

```tsx
import { CommandBus, createContainer } from "@wirestate/core";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { render, screen } from "@testing-library/react";

test("saves draft from command", async () => {
  const container = createContainer();

  render(withContainerProvider(<DraftEditor />, container));

  await container.get(CommandBus).executeAsync("SAVE_DRAFT");

  expect(await screen.findByText("Saved")).toBeInTheDocument();
});
```

## API Reference

[`withContainerProvider`](/api/wirestate-react/test-utils/functions/withContainerProvider),
[`createContainer`](/api/wirestate-core/functions/createContainer).
