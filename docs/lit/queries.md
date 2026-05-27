# Lit Queries

Lit query helpers register query handlers against the active container while the element is connected.

## Decorator Handler

```ts
import { onQuery } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("theme-answer")
export class ThemeAnswer extends LitElement {
  @onQuery("CURRENT_THEME")
  private currentTheme(): string {
    return "dark";
  }
}
```

## Controller Handler

```ts
import { useOnQuery } from "@wirestate/lit";
import { LitElement } from "lit";

class ThemeAnswer extends LitElement {
  private readonly query = useOnQuery(this, {
    type: "CURRENT_THEME",
    handler: () => "dark",
  });
}
```

## Execute From An Element

```ts
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("theme-button")
export class ThemeButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private theme: string = "unknown";

  private readTheme(): void {
    this.theme = this.scope.queryData<string>("CURRENT_THEME");
  }

  protected render() {
    return html`<button @click=${() => this.readTheme()}>Theme: ${this.theme}</button>`;
  }
}
```

Newer handlers shadow older handlers for the same query type.


---

API reference: [`onQuery`](/api/wirestate-lit/functions/onQuery), [`useOnQuery`](/api/wirestate-lit/functions/useOnQuery),
[`OnQueryController`](/api/wirestate-lit/classes/OnQueryController).
