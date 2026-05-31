# Core Events

Events are broadcast notifications. They say "this happened" and do not return a value.

Each container owns its own `EventBus`. Events stay in that container and do not bubble to a parent container.

## Emit from a Service

```ts
import { Inject, Injectable, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public addItem(item: CartItem): void {
    this.scope.emitEvent("CART_ITEM_ADDED", item, { from: this });
  }
}
```

## Handle with a Decorator

```ts
import { Injectable, OnEvent, WireEvent } from "@wirestate/core";

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
import { EventBus, createContainer } from "@wirestate/core";

const container = createContainer();
const bus = container.get(EventBus);

const unsubscribe = bus.subscribe((event) => {
  console.log(event.type);
});

bus.emit("CART_VIEWED");
unsubscribe();
```

## Subscribe from a Service

When a service owns a dynamic subscription, attach it during provider lifecycle and remove it during deprovision.

```ts
import {
  EventUnsubscriber,
  Inject,
  Injectable,
  OnDeprovision,
  OnProvision,
  WireEvent,
  WireScope,
} from "@wirestate/core";

@Injectable()
export class CartActivityService {
  private unsubscribe: EventUnsubscriber | null = null;

  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  @OnProvision()
  public onProvision(): void {
    this.unsubscribe = this.scope.subscribeToEvent((event: WireEvent) => {
      if (event.type === "CART_VIEWED") {
        this.recordView();
      }
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

[`EventBus`](/api/wirestate-core/classes/EventBus), [`WireScope`](/api/wirestate-core/classes/WireScope),
[`OnEvent`](/api/wirestate-core/functions/OnEvent), [`WireEvent`](/api/wirestate-core/interfaces/WireEvent),
[`EventUnsubscriber`](/api/wirestate-core/type-aliases/EventUnsubscriber).
