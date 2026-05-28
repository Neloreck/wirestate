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

Use `mockBind` with a fresh `mockContainer` when one service needs Wirestate wiring.

```ts
import { mockBind, mockContainer } from "@wirestate/core/test-utils";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = mockBind(mockContainer(), CounterService).get(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```

Skip lifecycle when hook setup is noise for the test.

```ts
import { mockBind, mockContainer } from "@wirestate/core/test-utils";

const service = mockBind(mockContainer(), CounterService, { skipLifecycle: true }).get(CounterService);
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
    activate: [CounterService],
    bindings: [LoggerService, CounterService],
  });

  const counter = container.get(CounterService);
  const events: Array<string | symbol> = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");
});
```

## Add Bindings

Use `mockBind` when a test starts from an existing container and needs one more service or descriptor. It accepts the
same binding shapes as `mockContainer({ bindings })`.

```ts
import { mockBind, mockContainer } from "@wirestate/core/test-utils";
import { CartService, PricingService } from "./services";

test("cart uses pricing service", () => {
  const container = mockContainer({ bindings: [CartService] });

  mockBind(container, PricingService);

  const cart = container.get(CartService);

  expect(cart.total()).toBe(25);
});
```

Use `mockUnbind` to remove a binding through the same cleanup path as core `unbind`.

```ts
import { mockBind, mockContainer, mockUnbind } from "@wirestate/core/test-utils";

const container = mockContainer({ bindings: [CartService] });

mockBind(container, PricingService);
mockUnbind(container, PricingService);
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { mockBind, mockContainer } from "@wirestate/core/test-utils";

test("cart uses mocked api client", async () => {
  const container = mockContainer({ bindings: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  mockBind(container, { id: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## API Reference

[`mockContainer`](/api/wirestate-core/test-utils/functions/mockContainer),
[`mockBind`](/api/wirestate-core/test-utils/functions/mockBind),
[`mockUnbind`](/api/wirestate-core/test-utils/functions/mockUnbind).
