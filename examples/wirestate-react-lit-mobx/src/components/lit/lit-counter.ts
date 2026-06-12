import { injection } from "@wirestate/lit";
import { MobxLitElement } from "@wirestate/lit-mobx";
import { css, CSSResult, html } from "lit";
import { customElement } from "lit/decorators.js";

import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

/**
 * A Lit web component that injects and renders the same MobX services the
 * surrounding React tree uses. It extends `MobxLitElement`, so reads of
 * observable service state during `render()` re-render the element.
 */
@customElement("w-lit-counter")
export class LitCounter extends MobxLitElement {
  public static styles: CSSResult = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    button {
      font-size: 16px;
      white-space: nowrap;
      padding: 5px 10px;
      border-radius: 5px;
      color: var(--text-h);
      background: var(--social-bg);
      border: 2px solid transparent;
      cursor: pointer;
      transition:
        border-color 0.3s,
        background 0.3s;
    }

    button:hover {
      border-color: var(--accent-border);
    }

    button.accent {
      color: var(--accent);
      background: var(--accent-bg);
    }
  `;

  @injection(CounterService)
  private readonly counterService!: CounterService;

  @injection(ThemeService)
  private readonly themeService!: ThemeService;

  protected render() {
    return html`
      <button class="accent" @click=${() => this.counterService.increment()}>
        Increment — count: ${this.counterService.count} (${this.counterService.isEven ? "even" : "odd"})
      </button>

      <button @click=${() => this.counterService.reset()}>Reset counter</button>

      <button @click=${() => this.themeService.toggle()}>Toggle theme (${this.themeService.theme})</button>
    `;
  }
}
