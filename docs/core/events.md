# Core Events

Events are broadcast notifications. They say "this happened" and do not return a value.

Each container owns its own `EventBus`. Events stay in that container and do not bubble to a parent container.

## Emit from a Service

```ts
import { EventBus, Injectable, inject } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(private readonly events: EventBus = inject(EventBus)) {}

  public addItem(item: CartItem): void {
    this.events.emit("CART_ITEM_ADDED", item, { source: this });
  }
}
```

## Handle with a Decorator

```ts
import { Injectable, OnEvent, WireEvent, inject } from "@wirestate/core";

@Injectable()
export class AnalyticsService {
  @OnEvent("CART_ITEM_ADDED")
  public trackAdd(event: WireEvent<CartItem>): void {
    this.track("add_to_cart", event.payload);
  }

  private track(name: string, payload: unknown): void {
    console.log(name, payload);
  }
}
```

Useful forms:

- `@OnEvent("TYPE")` listens to one type.
- `@OnEvent(["A", "B"])` listens to several types.
- `@OnEvent()` listens to everything on the container event bus.

## Subscribe Directly

Use direct subscriptions when the handler is dynamic or created at runtime.

```ts
import { Container, EventBus, EventsPlugin } from "@wirestate/core";

const container = new Container({ plugins: [new EventsPlugin()] });
const bus = container.get(EventBus);

const unsubscribe = bus.subscribe((event) => {
  console.log(event.type);
});

bus.emit("CART_VIEWED");
unsubscribe();
```

Pass one or more event types to receive only matching events. The bus indexes handlers by type, so unmatched
events never reach the handler and no manual filtering is needed.

```ts
const unsubscribe = bus.subscribe(["CART_VIEWED", "CART_CLEARED"], (event) => {
  console.log(event.type);
});
```

## Subscribe from a Service

When a service owns a dynamic subscription, attach it during provider lifecycle and remove it during deprovision.

```ts
import { EventBus, EventUnsubscribe, Injectable, OnDeprovision, OnProvision, inject } from "@wirestate/core";

@Injectable()
export class CartActivityService {
  private unsubscribe: EventUnsubscribe | null = null;

  public constructor(private readonly events: EventBus = inject(EventBus)) {}

  @OnProvision()
  public onProvision(): void {
    this.unsubscribe = this.events.subscribe("CART_VIEWED", () => {
      this.recordView();
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private recordView(): void {
    console.log("cart viewed");
  }
}
```

Use this pattern when the subscription depends on runtime state or cannot be expressed with `@OnEvent`.

If an event handler throws, Wirestate logs the error and continues with the next handler.

## API Reference

[`EventBus`](/api/wirestate-core/classes/EventBus), [`EventsPlugin`](/api/wirestate-core/classes/EventsPlugin),
[`OnEvent`](/api/wirestate-core/functions/OnEvent), [`WireEvent`](/api/wirestate-core/interfaces/WireEvent),
[`EventUnsubscribe`](/api/wirestate-core/type-aliases/EventUnsubscribe),
[`OnProvision`](/api/wirestate-core/functions/OnProvision),
[`OnDeprovision`](/api/wirestate-core/functions/OnDeprovision).
