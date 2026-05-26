# Messaging

Wirestate has three bus patterns. Each container owns its own buses.

| Pattern | Use it for       | Shape                                           |
| ------- | ---------------- | ----------------------------------------------- |
| Event   | "This happened." | One emitter, many subscribers, no return value. |
| Command | "Do this."       | One executor, one handler, async descriptor.    |
| Query   | "Give me this."  | One caller, one handler, returned value.        |

Child containers keep independent buses. Parent services do not hear child events unless you wire that yourself.

## Events

Events are broadcast notifications.

```ts
import { Event, Inject, Injectable, OnEvent, WireScope } from "@wirestate/core";

@Injectable()
export class CartService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public addItem(item: CartItem): void {
    this.scope.emitEvent("CART_ITEM_ADDED", item, { from: this });
  }
}

@Injectable()
export class AnalyticsService {
  @OnEvent("CART_ITEM_ADDED")
  public trackAdd(event: Event<CartItem>): void {
    this.track("add_to_cart", event.payload);
  }
}
```

Useful details:

- `@OnEvent("TYPE")` listens to one type.
- `@OnEvent(["A", "B"])` listens to several types.
- `@OnEvent()` listens to everything on that container's event bus.
- A throwing handler is logged; the next handler still runs.

React can subscribe and emit from components.

```tsx
import { Event } from "@wirestate/core";
import { useEvent, useEventEmitter } from "@wirestate/react";

function CartLogger() {
  const emit = useEventEmitter();

  useEvent("CART_ITEM_ADDED", (event: Event<CartItem>) => {
    console.log(event.payload);
  });

  return <button onClick={() => emit("CART_VIEWED")}>Open cart</button>;
}
```

Lit can do the same with element decorators.

```ts
import { Event, WireScope } from "@wirestate/core";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { injection, onEvent } from "@wirestate/lit";

@customElement("cart-logger")
export class CartLogger extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @onEvent("CART_ITEM_ADDED")
  private log(event: Event<CartItem>): void {
    console.log(event.payload);
  }

  public render() {
    return html`<button @click=${() => this.scope.emitEvent("CART_VIEWED")}>Open cart</button>`;
  }
}
```

## Commands

Commands trigger write work. A command has one active handler. Newer registrations shadow older ones.

```ts
import { Inject, Injectable, OnCommand, WireScope } from "@wirestate/core";

@Injectable()
export class AuthService {
  @OnCommand("LOGOUT")
  public async logout(): Promise<void> {
    await revokeSession();
  }
}

@Injectable()
export class HeaderService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public async logout(): Promise<void> {
    const command = this.scope.executeCommand("LOGOUT");

    await command.task;
  }
}
```

`executeCommand` throws `WirestateError` when no handler exists.

Use optional commands when absence is normal.

```ts
const command = this.scope.executeOptionalCommand("REFRESH_DEVTOOLS");

if (command) {
  await command.task;
}
```

React can dispatch or handle commands for component lifetime.

```tsx
import { useCommandExecutor, useCommandHandler } from "@wirestate/react";

function SearchPanel() {
  const executeCommand = useCommandExecutor();

  useCommandHandler("OPEN_SEARCH", () => setOpen(true));

  return <button onClick={() => executeCommand("OPEN_SEARCH")}>Search</button>;
}
```

Lit elements can dispatch and handle commands for their connected lifetime.

```ts
import { WireScope } from "@wirestate/core";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { injection, onCommand } from "@wirestate/lit";

@customElement("search-panel")
export class SearchPanel extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private open: boolean = false;

  @onCommand("OPEN_SEARCH")
  private openSearch(): void {
    this.open = true;
  }

  public render() {
    return html`
      <button @click=${() => this.scope.executeCommand("OPEN_SEARCH")}>Search</button>
      ${this.open ? html`<span>Open</span>` : null}
    `;
  }
}
```

## Queries

Queries read data owned elsewhere. They return the handler result.

```ts
import { Inject, Injectable, OnQuery, WireScope } from "@wirestate/core";

@Injectable()
export class ThemeService {
  private theme: string = "dark";

  @OnQuery("CURRENT_THEME")
  public currentTheme(): string {
    return this.theme;
  }
}

@Injectable()
export class ToolbarService {
  public constructor(@Inject(WireScope) private readonly scope: WireScope) {}

  public getTheme(): string {
    return this.scope.queryData<string>("CURRENT_THEME");
  }
}
```

Choose the query call by return shape:

- `queryData` returns the handler result as-is.
- `queryDataAsync` always returns a Promise.
- `queryOptionalData` returns `null` if no handler exists.
- `queryOptionalDataAsync` combines both behaviors.

React can call or answer queries.

```tsx
import { useQueryExecutor, useQueryHandler } from "@wirestate/react";

function ThemeButton() {
  const query = useQueryExecutor();

  useQueryHandler("BUTTON_LABEL", () => "Save");

  return <button>{query<string>("BUTTON_LABEL")}</button>;
}
```

Lit elements can call or answer queries through the current container scope.

```ts
import { WireScope } from "@wirestate/core";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { injection, onQuery } from "@wirestate/lit";

@customElement("theme-button")
export class ThemeButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private label: string = "Load label";

  @onQuery("BUTTON_LABEL")
  private buttonLabel(): string {
    return "Save";
  }

  private readLabel(): void {
    this.label = this.scope.queryData<string>("BUTTON_LABEL");
  }

  public render() {
    return html`<button @click=${() => this.readLabel()}>${this.label}</button>`;
  }
}
```

## Handler Stacks

Commands and queries use a stack per token. The newest handler wins.

That matters in scoped UI. A child provider can override a query while a modal is open. When the modal unmounts, its handler unregisters and the parent answer becomes active again.
