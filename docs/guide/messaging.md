# Messaging

Wirestate provides three message-passing patterns. All three buses live on the container and are scoped to it — child containers have independent buses.

| Pattern | Direction           | Cardinality | Return                     |
| ------- | ------------------- | ----------- | -------------------------- |
| Event   | Emit -> subscribers | 1 -> many   | void                       |
| Command | Caller -> handler   | 1 -> 1      | `CommandDescriptor`        |
| Query   | Caller -> handler   | 1 -> 1      | result \ `Promise<result>` |


## Choosing a Pattern

| Use     | When                                                                                      |
| ------- | ----------------------------------------------------------------------------------------- |
| Event   | Notification that something happened. Callers don't care who's listening or if anyone is. |
| Command | Trigger a side-effectful operation. Caller wants to know when it finishes.                |
| Query   | Read data owned by another service without creating a direct dependency.                  |


## Events

Events are fire-and-forget broadcasts. Any number of services or UI components can subscribe.
Emitting always returns `void`; handlers run synchronously in subscription order.

### Emitting

Emit from a service via `WireScope`:

```ts
import { Injectable, Inject, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  // ...

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {}

  public addItem(item: CartItem): void {
    this.items.value = [...this.items.value, item];
    this.scope.emitEvent("CART_ITEM_ADDED", item);
  }

  // ...
}
```

The third `from` argument identifies the emitter (defaults to the scope instance):

```ts
this.scope.emitEvent("CART_ITEM_ADDED", item, this);
```

### Subscribing — Services

`@OnEvent` registers a method as a subscriber. The method receives the full `Event<Payload>` object.

```ts
import { Injectable, OnEvent, Event } from "@wirestate/core";

@Injectable()
export class AnalyticsService {
  // ...

  // Single event type:
  @OnEvent("CART_ITEM_ADDED")
  private onCartItemAdded(event: Event<CartItem>): void {
    this.track("add_to_cart", event.payload);
  }

  // Multiple types:
  @OnEvent(["CART_ITEM_ADDED", "CART_ITEM_REMOVED"])
  private onCartChanged(): void {
    this.syncCart();
  }

  // Catch-all — receives every event on the bus:
  @OnEvent()
  private onAnyEvent(event: Event): void {
    console.debug("[analytics-debug]", event.type);
  }

  // ...
}
```

Subscriptions are automatically registered on activation and unregistered on deactivation.

### Subscribing — React

```tsx
import { useEvent, useEvents, useEventsHandler, useEventEmitter } from "@wirestate/react";

// Single type:
useEvent("CART_ITEM_ADDED", (event) => {
  console.log("Item added:", event.payload);
});

// Multiple types:
useEvents(["CART_ITEM_ADDED", "CART_ITEM_REMOVED"], (event) => {
  console.log("Cart event:", event.type, event.payload);
});

// Catch-all:
useEventsHandler((event) => {
  console.log("Any event:", event.type);
});

// emit from a component
const emit = useEventEmitter();
emit("USER_PINGED");
```

## Commands

Commands are named, one-way write operations dispatched to exactly one registered handler.
Wirestate throws `WirestateError` if no handler is registered — use `executeOptionalCommand` / `useOptionalCommandCaller` when the handler may be absent.

The caller receives a `CommandDescriptor` immediately; the actual work happens asynchronously.
Check `descriptor.status` (`pending` -> `settled` | `error`) or `await descriptor.task`.

### Registering — Services

```ts
import { Injectable, OnCommand } from "@wirestate/core";

@Injectable()
export class AuthService {
  // ...

  @OnCommand("LOGOUT")
  public async onLogout(): Promise<void> {
    await revokeSession();
    this.user.value = null;
  }

  // ...
}
```

### Dispatching — Services

```ts
const descriptor: CommandDescriptor = this.scope.executeCommand("LOGOUT");
await descriptor.task; // resolves when handler settles
```

Optional dispatch — returns `null` if no handler is bound:

```ts
const descriptor: CommandDescriptor | null = this.scope.executeOptionalCommand("LOGOUT");

if (descriptor) {
  await descriptor.task;
}
```

### Dispatching — React

```tsx
import { useCommandCaller, useOptionalCommandCaller, CommandCaller } from "@wirestate/react";

function LogoutButton() {
  const callCommand: CommandCaller = useCommandCaller();

  return (
    <button
      onClick={() => {
        const descriptor = callCommand("LOGOUT");

        descriptor.task.then(() => navigate("/login"));
      }}
    >
      Log out
    </button>
  );
}
```

### Handling in React

Register a handler from a component for the lifetime of that component:

```tsx
import { useCommandHandler } from "@wirestate/react";

function SearchPanel() {
  useCommandHandler("OPEN_SEARCH", () => {
    setOpen(true);
  });

  // ...
}
```

## Queries

Queries are synchronous or asynchronous request-response calls. The last registered handler wins (shadows earlier ones).
Wirestate throws if no handler is registered — use optional variants when needed.

### Registering — Services

```ts
import { Injectable, OnQuery } from "@wirestate/core";

@Injectable()
export class SettingsService {
  // ...

  private theme: string = "dark";

  // Sync handler:
  @OnQuery("GET_THEME")
  public getTheme(): string {
    return this.theme;
  }

  // Async handler:
  @OnQuery("FETCH_USER_PROFILE")
  public async fetchProfile(userId: string): Promise<UserProfile> {
    return fetchFromApi(`/users/${userId}`);
  }

  // ...
}
```

### Dispatching — Services

```ts
// Sync — returns result directly:
const theme = this.scope.queryData<string>("GET_THEME");

// Async — returns Promise:
const profile = await this.scope.queryData<UserProfile>("FETCH_USER_PROFILE", userId);

// Optional — returns null if no handler:
const config = this.scope.queryOptionalData<Config>("GET_CONFIG");
```

### Dispatching — React

```tsx
import { useQueryCaller, useSyncQueryCaller, useOptionalQueryCaller, QueryCaller } from "@wirestate/react";

function ProfileCard({ userId }: { userId: string }) {
  // ...

  const query: QueryCaller = useQueryCaller();

  const loadProfile = async () => {
    const profile = await query<UserProfile>("FETCH_USER_PROFILE", userId);

    setProfile(profile);
  };

  // ...

  const syncQuery = useSyncQueryCaller();

  const refreshTheme = async () => {
    const theme = syncQuery<string>("GET_THEME");

    setTheme(theme);
  };

  // ...
}
```

Register a query handler from a component:

```tsx
import { useQueryHandler } from "@wirestate/react";

function DateWidget() {
  useQueryHandler("GET_CURRENT_DATE", () => new Date());

  // ...
}
```
