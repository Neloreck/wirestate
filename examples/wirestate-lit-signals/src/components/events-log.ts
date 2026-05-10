import { SignalWatcher } from "@lit-labs/signals";
import { injection } from "@wirestate/lit";
import { css, CSSResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { LoggerService } from "@/services/LoggerService";
import { resetStyles } from "@/styles/reset";

@customElement("w-events-log")
export class EventsLog extends SignalWatcher(LitElement) {
  public static styles: Array<CSSResult> = [
    resetStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);

        h3 {
          color: var(--accent);
        }

        button {
          align-self: flex-start;
        }

        .events-log {
          list-style: none;
          max-height: 320px;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: var(--border-radius-lg);
          padding: 0;
          background: var(--code-bg);
          font-size: 13px;
        }

        .events-log-entry {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
        }

        .no-logs-label {
          padding: var(--space-2);
        }
      }
    `,
  ];

  @injection({ injectionId: LoggerService })
  private readonly loggerService!: LoggerService;

  public render() {
    return html`
      <h3>Events log</h3>

      <div class="events-log">
        ${this.loggerService.logs.get().length
          ? this.loggerService.logs.get().map(
              (it) =>
                html`<div class="events-log-entry">
                  <span>${JSON.stringify(it.type)}</span>
                  <span>${it.payload !== undefined ? JSON.stringify(it.payload) : "—"}</span>
                </div>`
            )
          : html`<div class="no-logs-label">No events yet — try the buttons above.</div>`}
      </div>
    `;
  }
}
