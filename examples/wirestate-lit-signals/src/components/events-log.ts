import { SignalWatcher } from "@lit-labs/signals";
import { injection } from "@wirestate/lit";
import { css, CSSResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { LoggerService } from "@/services/LoggerService";

@customElement("w-events-log")
export class EventsLog extends SignalWatcher(LitElement) {
  public static styles: Array<CSSResult> = [
    css`
      :host {
        padding: 0 16px;
      }

      .events-log {
        list-style: none;
        padding: 0;
        margin: 16px 0;
        max-height: 280px;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--code-bg);
        font-family: var(--mono);
        font-size: 13px;
      }

      .events-log-entry {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border);
      }
    `,
  ];

  @injection({ injectionId: LoggerService })
  private readonly loggerService!: LoggerService;

  public onClearLogs(): void {
    this.loggerService.clear();
  }

  public render() {
    console.info(`[${this.constructor.name}] render:`, {
      loggerService: this.loggerService,
    });

    return html`<div>
      <h2>Events log</h2>

      <div class="events-log">
        ${this.loggerService.logs.get().length
          ? this.loggerService.logs.get().map(
              (it) =>
                html`<div class="events-log-entry">
                  <span>${JSON.stringify(it.type)}</span>
                  <span>${it.payload !== undefined ? JSON.stringify(it.payload) : "—"}</span>
                </div>`
            )
          : html`<div>No events yet — try the buttons above.</div>`}
      </div>

      <button @click="${() => this.onClearLogs()}">Clear log</button>
    </div>`;
  }
}
