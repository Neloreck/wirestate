# Testing

Services are plain TypeScript classes. Business logic tests do not need React, Lit, or DOM setup.

## Unit Testing — No Container

For pure logic with no DI dependencies, instantiate directly.

```ts
import { LoggerService } from "./LoggerService";

test("logs a message", () => {
  const logger = new LoggerService();
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});

  logger.log("hello");

  expect(spy).toHaveBeenCalledWith("[log] hello");

  spy.mockRestore();
});
```

## mockService — Single Service

`mockService` binds one service to a fresh container and returns its instance. Handles lifecycle automatically.

```ts
import { mockService } from "@wirestate/core/test-utils";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = mockService(CounterService);

  service.increment();

  expect(service.count.value).toBe(1);
});
```

Skip lifecycle hooks (`@OnActivated` / `@OnDeactivation`) when you only want to test methods in isolation:

```ts
const service = mockService(CounterService, mockContainer(), { skipLifecycle: true });
```

## mockContainer — Multiple Services

`mockContainer` binds multiple services and their dependencies into one container. Use `activate` to trigger `@OnActivated` on specific services before the test runs.

```ts
import { mockContainer } from "@wirestate/core/test-utils";
import { LoggerService } from "./LoggerService";
import { CounterService } from "./CounterService";

test("counter emits event on increment", () => {
  const container = mockContainer({
    entries: [LoggerService, CounterService],
    activate: [CounterService],
  });

  const counter = container.get(CounterService);
  const events: string[] = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");
});
```

## Mocking Dependencies

Replace a service binding with a mock before resolving:

```ts
import { mockContainer } from "@wirestate/core/test-utils";
import { bindConstant } from "@wirestate/core";

test("cart uses mocked api client", async () => {
  const container = mockContainer({ entries: [CartService] });
  const mockApi = { post: jest.fn().mockResolvedValue({ ok: true }) };

  bindConstant(container, ApiClient, mockApi as unknown as ApiClient);

  const cart = container.get(CartService);
  await cart.checkout();

  expect(mockApi.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## mockBindService and mockUnbindService

Use these when you need fine-grained control over which services are added or removed from an existing container mid-test.

```ts
import { mockBindService, mockUnbindService } from "@wirestate/core/test-utils";

const container = mockContainer({ entries: [LoggerService] });

mockBindService(container, CounterService);

// later — swap out the implementation
mockUnbindService(container, CounterService);
mockBindService(container, CounterService, { skipLifecycle: true });
```

## React Testing

Wrap a component tree with an `IocProvider` backed by a test container:

```tsx
import { IocProvider } from "@wirestate/react";
import { render } from "@testing-library/react";
import { mockContainer } from "@wirestate/core/test-utils";
import { CounterService } from "./CounterService";
import { Counter } from "./Counter";

test("renders count", () => {
  const container = mockContainer({ entries: [CounterService], activate: [CounterService] });

  const { getByText } = render(
    <IocProvider container={container}>
      <Counter />
    </IocProvider>
  );

  expect(getByText("Count: 0")).toBeInTheDocument();
});
```
