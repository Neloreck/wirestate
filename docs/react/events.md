# React Events

Event hooks let React components emit and subscribe to events on the active container's `EventBus`. Subscriptions are
tied to the component lifetime.

## Register the Plugin

These hooks use the active container's `EventBus`, which exists only when `EventsPlugin` is registered in your provider's
`config.plugins`. See [React Containers › Messaging](/react/containers#messaging).

## Emit Events

```tsx
import { useEventEmitter } from "@wirestate/react";

function CartButton() {
  const emit = useEventEmitter();

  return <button onClick={() => emit("CART_VIEWED")}>Open cart</button>;
}
```

## Listen To One Event

```tsx
import { WireEvent } from "@wirestate/core";
import { useEvent } from "@wirestate/react";

function CartLogger() {
  useEvent("CART_ITEM_ADDED", (event: WireEvent<CartItem>) => {
    console.log(event.payload);
  });

  return null;
}
```

## Listen To Several Events

```tsx
import { useEvents } from "@wirestate/react";

function CartActivity() {
  useEvents(["CART_ITEM_ADDED", "CART_VIEWED"], (event) => {
    console.log(event.type);
  });

  return null;
}
```

## Listen To All Events

```tsx
import { useAllEvents } from "@wirestate/react";

function EventLog() {
  useAllEvents((event) => {
    console.log(event.type);
  });

  return null;
}
```

Subscriptions unregister when the component unmounts or the active container changes.

## API Reference

[`useEventEmitter`](/api/wirestate-react/functions/useEventEmitter), [`useEvent`](/api/wirestate-react/functions/useEvent),
[`useEvents`](/api/wirestate-react/functions/useEvents), [`useAllEvents`](/api/wirestate-react/functions/useAllEvents).
