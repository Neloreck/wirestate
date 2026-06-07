# Lit Commands

Command helpers let Lit elements register command handlers on the active container while the element is connected.

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

Handlers may also be asynchronous.

```ts
import { onCommand } from "@wirestate/lit";
import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("draft-commands")
export class DraftCommands extends LitElement {
  @onCommand("SAVE_DRAFT")
  private async saveDraft(draft: Draft): Promise<void> {
    await persistDraft(draft);
  }
}
```

## Execute from an Element

Use `executeCommand` for synchronous handlers.

```ts
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";

class SearchButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  protected render() {
    return html`<button @click=${() => this.scope.executeCommand("OPEN_SEARCH")}>Search</button>`;
  }
}
```

Use `executeCommandAsync` for async work.

```ts
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";

class SaveButton extends LitElement {
  @injection(WireScope)
  private scope!: WireScope;

  @state()
  private saving: boolean = false;

  private async save(): Promise<void> {
    this.saving = true;

    try {
      await this.scope.executeCommandAsync("SAVE_DOCUMENT");
    } finally {
      this.saving = false;
    }
  }

  protected render() {
    return html`<button ?disabled=${this.saving} @click=${() => void this.save()}>Save</button>`;
  }
}
```

Use optional commands when a missing handler is valid.

```ts
await this.scope.executeOptionalCommandAsync("EXPORT_TRACE");
```

If several handlers use the same command type, the newest one handles the command.

## API Reference

[`onCommand`](/api/wirestate-lit/functions/onCommand),
[`useOnCommand`](/api/wirestate-lit/functions/useOnCommand),
[`OnCommandController`](/api/wirestate-lit/classes/OnCommandController).
