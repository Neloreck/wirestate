# React Events

React event hooks subscribe to the active container's `EventBus` for the component lifetime.

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
import { Event } from "@wirestate/core";
import { useEvent } from "@wirestate/react";

function CartLogger() {
  useEvent("CART_ITEM_ADDED", (event: Event<CartItem>) => {
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
import { useEventsHandler } from "@wirestate/react";

function EventLog() {
  useEventsHandler((event) => {
    console.log(event.type);
  });

  return null;
}
```

Subscriptions unregister when the component unmounts or the active container changes.

## API Reference

[`useEventEmitter`](/api/wirestate/functions/useEventEmitter), [`useEvent`](/api/wirestate/functions/useEvent),
[`useEvents`](/api/wirestate/functions/useEvents), [`useEventsHandler`](/api/wirestate/functions/useEventsHandler).
