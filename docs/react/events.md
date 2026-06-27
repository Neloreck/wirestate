# React Events

Event hooks let React components emit and subscribe to events on the active container's `EventBus`. Subscriptions are
tied to the component lifetime.

## Register the Plugin

These hooks use the active container's `EventBus`, which exists only when `EventsPlugin` is registered in your provider's
`config.plugins`. See [React Containers > Messaging](/react/containers#messaging).

## Emit Events

```tsx
import { useEventEmitter } from "@wirestate/react";

function CartButton() {
  const emit = useEventEmitter();

  return <button onClick={() => emit("CART_VIEWED")}>Open cart</button>;
}
```

## Subscribe To Events

`useOnEvents` mirrors `EventBus.subscribe`.
Pass a single type, an array of types, or only a handler to receive every event.
The subscription is cleaned up when the component unmounts, the active container changes, or the listened type
membership changes.

```tsx
import { WireEvent } from "@wirestate/core";
import { useOnEvents } from "@wirestate/react";

function CartActivity() {
  // One type.
  useOnEvents("CART_ITEM_ADDED", (event: WireEvent<CartItem>) => {
    console.log(event.payload);
  });

  // Several types.
  useOnEvents(["CART_ITEM_ADDED", "CART_VIEWED"], (event) => {
    console.log(event.type);
  });

  // Every event - pass only a handler.
  useOnEvents((event) => {
    console.log(event.type);
  });

  return null;
}
```

Passing only a handler subscribes to every event, which is useful for logging or debugging. Provide a type or list of
types to scope the subscription.

## API Reference

[`useEventEmitter`](/api/wirestate-react/functions/useEventEmitter),
[`useOnEvents`](/api/wirestate-react/functions/useOnEvents).
