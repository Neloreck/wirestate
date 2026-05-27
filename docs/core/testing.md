# Core Testing

Services are TypeScript classes, but most services are designed to be resolved by a container. Test simple services
directly when their constructor and methods do not need Wirestate. Use a mock container when dependency injection,
lifecycle, seeds, or buses are part of the behavior.

## No Container

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

## One Service

`mockService` creates a mock container, binds the service, and returns the instance.

```ts
import { mockService } from "@wirestate/core/test-utils";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = mockService(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```

Skip lifecycle when hook setup is noise for the test.

```ts
import { mockContainer, mockService } from "@wirestate/core/test-utils";

const service = mockService(CounterService, mockContainer(), { skipLifecycle: true });
```

## Several Services

`mockContainer` binds a group of services. Use `activate` when resolution-time behavior needs to run before assertions.
Use `provisionContainer` when the behavior under test lives in `@OnProvision` or `@OnDeprovision`.

```ts
import { EventBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";
import { CounterService, LoggerService } from "./services";

test("counter emits event on increment", () => {
  const container = mockContainer({
    entries: [LoggerService, CounterService],
    activate: [CounterService],
  });

  const counter = container.get(CounterService);
  const events: Array<string | symbol> = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");
});
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { bindConstant } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

test("cart uses mocked api client", async () => {
  const container = mockContainer({ entries: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  bindConstant(container, { id: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```


---

API reference: [`mockService`](/api/wirestate/test-utils/functions/mockService),
[`mockContainer`](/api/wirestate/test-utils/functions/mockContainer), [`mockBindEntry`](/api/wirestate/test-utils/functions/mockBindEntry),
[`mockBindService`](/api/wirestate/test-utils/functions/mockBindService), [`mockUnbindService`](/api/wirestate/test-utils/functions/mockUnbindService).
