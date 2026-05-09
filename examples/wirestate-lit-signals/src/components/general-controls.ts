import { watch } from "@lit-labs/signals";
import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { computed } from "@wirestate/lit-signals";
import { css, CSSResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

@customElement("w-general-controls")
export class GeneralControls extends LitElement {
  public static styles: Array<CSSResult> = [
    css`
      :host {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .control {
        font-size: 16px;
        padding: 5px 10px;
        border-radius: 5px;
        color: var(--accent);
        background: var(--accent-bg);
        border: 2px solid transparent;
        transition:
          border-color 0.3s,
          background 0.3s;
        cursor: pointer;

        &:hover {
          border-color: var(--accent-border);
        }
        &:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        &.ghost {
          color: var(--text-h);
          background: var(--social-bg);
        }
      }

      .controls-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-bottom: 24px;
      }
    `,
  ];

  @injection({ injectionId: CounterService })
  private readonly counterService!: CounterService;

  @injection({ injectionId: ThemeService })
  private readonly themeService!: ThemeService;

  @injection({ injectionId: LoggerService })
  private readonly loggerService!: LoggerService;

  @injection({ injectionId: WireScope })
  private readonly scope!: WireScope;

  private isOddLabel = computed(() => (this.counterService.count.get() % 2 === 0 ? "even" : "odd"));

  public render() {
    console.info(`[${this.constructor.name}] render:`, {
      scope: this.scope,
      loggerService: this.loggerService,
      themeService: this.themeService,
      counterService: this.counterService,
    });

    return html`
      <div>
        <h2>Wirestate Playground</h2>
        <p>lit signals + inversify container + custom events/queries/commands</p>
      </div>

      <div class="controls-row">
        <button class="control" @click="${() => this.counterService.increment()}">
          count: ${watch(this.counterService.count)} (${watch(this.isOddLabel)})
        </button>

        <button class="control ghost" @click="${() => this.scope.emitEvent(EGlobalEvent.COUNTER_INCREMENT, 3)}">
          increment+3 (signal)
        </button>

        <button class="control ghost" @click="${() => this.themeService.toggleTheme()}">
          theme ${watch(this.themeService.theme)}
        </button>
      </div>
    `;
  }
}
