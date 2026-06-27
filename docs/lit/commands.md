# Lit Commands

Command helpers let Lit elements register command handlers on the active container while the element is connected.

## Register the Plugin

These helpers use the active container's `CommandBus`, which exists only when `CommandsPlugin` is registered in the
provider's `config.plugins`. See [Lit Containers > Messaging](/lit/containers#messaging).

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

The handler registers when the element connects, unregisters when it disconnects, and moves to the new bus when the
nearest container context changes.

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

Inject `CommandBus` when an element needs to send commands. Use `execute` for synchronous handlers.

```ts
import { CommandBus } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";

class SearchButton extends LitElement {
  @injection(CommandBus)
  private commands!: CommandBus;

  protected render() {
    return html`<button @click=${() => this.commands.execute("OPEN_SEARCH")}>Search</button>`;
  }
}
```

Use `executeAsync` for async work.

```ts
import { CommandBus } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";

class SaveButton extends LitElement {
  @injection(CommandBus)
  private commands!: CommandBus;

  @state()
  private saving: boolean = false;

  private async save(): Promise<void> {
    this.saving = true;

    try {
      await this.commands.executeAsync("SAVE_DOCUMENT");
    } finally {
      this.saving = false;
    }
  }

  protected render() {
    return html`<button ?disabled=${this.saving} @click=${() => void this.save()}>Save</button>`;
  }
}
```

Use optional commands when a missing handler is valid. Pass a literal `{ optional: true }`.

```ts
await this.commands.executeAsync("EXPORT_TRACE", undefined, { optional: true });
```

The optional call returns `undefined` instead of throwing when no handler is registered.

Command handlers are stack-based. If several connected elements register the same command type, the newest active
handler handles the command. When that element disconnects or moves to another container, the previous handler becomes
active again. See [Core Commands](/core/commands).

## API Reference

[`onCommand`](/api/wirestate-lit/functions/onCommand),
[`useOnCommand`](/api/wirestate-lit/functions/useOnCommand),
[`OnCommandController`](/api/wirestate-lit/classes/OnCommandController),
[`CommandBus`](/api/wirestate-core/classes/CommandBus),
[`CommandDispatchOptions`](/api/wirestate-core/interfaces/CommandDispatchOptions).
