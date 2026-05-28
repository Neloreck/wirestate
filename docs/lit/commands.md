# Lit Commands

Lit command helpers register command handlers against the active container while the element is connected.

## Decorator Handler

```ts
import { onCommand } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("search-panel")
export class SearchPanel extends LitElement {
  @state()
  private open: boolean = false;

  @onCommand("OPEN_SEARCH")
  private openSearch(): void {
    this.open = true;
  }

  protected render() {
    return this.open ? html`<div>Search</div>` : null;
  }
}
```

## Controller Handler

```ts
import { useOnCommand } from "@wirestate/lit";
import { LitElement } from "lit";
import { state } from "lit/decorators.js";

class SearchPanel extends LitElement {
  @state()
  private open: boolean = false;

  private readonly openSearch = useOnCommand(this, {
    type: "OPEN_SEARCH",
    handler: () => {
      this.open = true;
    },
  });
}
```

## Execute From An Element

```ts
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";

class SearchButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  protected render() {
    return html`<button @click=${() => void this.scope.executeCommand("OPEN_SEARCH").task}>Search</button>`;
  }
}
```

Newer handlers shadow older handlers for the same command type.

## API Reference

[`onCommand`](/api/wirestate-lit/functions/onCommand),
[`useOnCommand`](/api/wirestate-lit/functions/useOnCommand), [`OnCommandController`](/api/wirestate-lit/classes/OnCommandController).
