# Core Testing

Services are TypeScript classes, but most services are designed to be resolved by a container. Test simple services
directly when their constructor and methods do not need Wirestate. Use a fresh container when dependency injection,
lifecycle or message buses are part of the behavior.

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

Use `container.bind` with a fresh `Container` when one service needs Wirestate wiring.

```ts
import { Container } from "@wirestate/core";
import { CounterService } from "./CounterService";

test("increments count", () => {
  const service = new Container().bind(CounterService).get(CounterService);

  service.increment();

  expect(service.count).toBe(1);
});
```

## Several Services

`new Container(...)` binds a group of services. Use `activate` when activation behavior needs to run before assertions.
Call `container.provision()` whenever the behavior under test relies on messaging: auto-wired `@OnEvent`, `@OnCommand`,
and `@OnQuery` handlers subscribe at provision and unsubscribe at deprovision, so without a UI provider a plain-core test
must provision the container first. Tear down with `container.deprovision()` (or `container.unbindAll()`, which
deprovisions first).

```ts
import { Container, EventBus, EventsPlugin } from "@wirestate/core";
import { CounterService, LoggerService } from "./services";

test("counter emits event on increment", () => {
  const container = new Container({
    bindings: [LoggerService, CounterService],
    plugins: [new EventsPlugin()],
  });

  // Subscribes the auto-wired @OnEvent handlers before the event is emitted.
  container.provision();

  const counter = container.get(CounterService);
  const events: Array<string | symbol> = [];

  container.get(EventBus).subscribe((event) => events.push(event.type));

  counter.increment();

  expect(events).toContain("COUNTER_INCREMENTED");

  container.deprovision();
});
```

## Add Bindings

Use `container.bind` when a test starts from an existing container and needs one more service or descriptor.

```ts
import { Container } from "@wirestate/core";
import { CartService, PricingService } from "./services";

test("cart uses pricing service", () => {
  const container = new Container({ bindings: [CartService] });

  container.bind(PricingService);

  const cart = container.get(CartService);

  expect(cart.total()).toBe(25);
});
```

Use `container.unbind` to remove a binding, deactivating any constructed service.

```ts
import { Container } from "@wirestate/core";

const container = new Container({ bindings: [CartService] });

container.bind(PricingService);
container.unbind(PricingService);
```

## Replace Dependencies

Bind a constant under the dependency token before resolving the service under test.

```ts
import { Container } from "@wirestate/core";

test("cart uses mocked api client", async () => {
  const container = new Container({ bindings: [CartService] });
  const api = { post: jest.fn().mockResolvedValue({ ok: true }) };

  container.bind({ token: ApiClient, value: api as unknown as ApiClient });

  const cart = container.get(CartService);
  await cart.checkout();

  expect(api.post).toHaveBeenCalledWith("/checkout", expect.anything());
});
```

## API Reference

[`Container`](/api/wirestate-core/classes/Container), [`EventBus`](/api/wirestate-core/classes/EventBus),
[`EventsPlugin`](/api/wirestate-core/classes/EventsPlugin).
