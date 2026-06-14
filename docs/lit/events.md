# Lit Events

Event helpers let Lit elements subscribe to events on the active container while the element is connected.

## Register the Plugin

These helpers use the active container's `EventBus`, which exists only when `EventsPlugin` is registered in the provider's
`config.plugins`. See [Lit Containers › Messaging](/lit/containers#messaging).

## Decorator Handler

```ts
import { WireEvent } from "@wirestate/core";
import { onEvent } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("cart-logger")
export class CartLogger extends LitElement {
  @onEvent("CART_ITEM_ADDED")
  private log(event: WireEvent<CartItem>): void {
    console.log(event.payload);
  }
}
```

Useful forms:

- `@onEvent("TYPE")` listens to one type.
- `@onEvent(["A", "B"])` listens to several types.
- `@onEvent()` listens to all events.

## Controller Handler

```ts
import { useOnEvents } from "@wirestate/lit";
import { LitElement } from "lit";

class CartLogger extends LitElement {
  private readonly events = useOnEvents(this, {
    types: ["CART_ITEM_ADDED"],
    handler: (event) => console.log(event.payload),
  });
}
```

## Emit from an Element

Inject `EventBus` when an element needs to emit.

```ts
import { EventBus } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";

class CartButton extends LitElement {
  @injection(EventBus)
  private events!: EventBus;

  protected render() {
    return html`<button @click=${() => this.events.emit("CART_VIEWED", undefined, { source: this })}>Cart</button>`;
  }
}
```

Handlers unregister when the element disconnects or its active container changes.

## API Reference

[`onEvent`](/api/wirestate-lit/functions/onEvent), [`useOnEvents`](/api/wirestate-lit/functions/useOnEvents),
[`OnEventController`](/api/wirestate-lit/classes/OnEventController).
