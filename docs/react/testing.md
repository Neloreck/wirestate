# React Testing

Use core test helpers for services. Use `@wirestate/react/test-utils` when a component needs a Wirestate provider.

## Render With A Container

`withContainerProvider` wraps a React tree with a test container.

```tsx
import { render } from "@testing-library/react";
import { mockContainer } from "@wirestate/core/test-utils";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { Counter } from "./Counter";
import { CounterService } from "./CounterService";

test("renders count", () => {
  const container = mockContainer({ bindings: [CounterService], activate: true });

  const { getByText } = render(withContainerProvider(<Counter />, container));

  expect(getByText("Count: 0")).toBeInTheDocument();
});
```

## Test Hook Handlers Through UI

Command, query, and event hooks register against the active container. Render the component under a container, then drive
the behavior through user events or the container bus.

```tsx
import { CommandBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { withContainerProvider } from "@wirestate/react/test-utils";
import { render } from "@testing-library/react";

test("opens search from command", async () => {
  const container = mockContainer();

  const { findByText } = render(withContainerProvider(<SearchPanel />, container));

  await container.get(CommandBus).execute("OPEN_SEARCH").result;

  expect(await findByText("Search")).toBeInTheDocument();
});
```

## API Reference

[`withContainerProvider`](/api/wirestate-react/test-utils/functions/withContainerProvider),
[`mockContainer`](/api/wirestate-core/test-utils/functions/mockContainer).
