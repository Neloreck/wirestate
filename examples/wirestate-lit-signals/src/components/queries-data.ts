import { WireScope } from "@wirestate/core";
import { injection } from "@wirestate/lit";
import { html, LitElement, CSSResult, css } from "lit";
import { customElement, state } from "lit/decorators.js";

import { ECounterServiceQuery, ICounterSnapshot } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";
import { resetStyles } from "@/styles/reset";
import { Optional } from "@/types";

@customElement("w-queries-data")
export class QueriesData extends LitElement {
  public static styles: Array<CSSResult> = [
    resetStyles,
    css`
      :host {
        padding: var(--space-2);

        h3 {
          color: var(--accent);
        }

        .summaries {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin: var(--space-2) 0;
          font-size: var(--text-sm);
        }

        .summary-paragraph {
          padding: var(--space-2);
          border: 1px solid var(--accent);
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
        }
      }
    `,
  ];

  @injection(LoggerService)
  private readonly loggerService!: LoggerService;

  @injection(WireScope)
  private readonly scope!: WireScope;

  @state()
  private snapshot: Optional<ICounterSnapshot> = null;

  @state()
  private summary: Optional<ICounterSnapshot> = null;

  public async onQuerySummary(): Promise<void> {
    this.summary = await this.scope.queryData(ECounterServiceQuery.GET_COUNTER_SUMMARY, { value: "some-data" });
  }

  public async onQuerySnapshot(): Promise<void> {
    this.snapshot = await this.scope.queryData<ICounterSnapshot>(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT);
  }

  public render() {
    return html`
      <h3>Queries</h3>

      <div class="query-controls">
        <button class="control" @click="${() => this.onQuerySummary()}">Query summary</button>
        <button class="control" @click="${() => this.onQuerySnapshot()}">Query snapshot</button>
      </div>

      <div class="summaries">
        ${this.summary
          ? html`<p class="summary-paragraph">
              <span>Summary — count:</span> <strong>${this.summary.count}</strong>

              <span>Last incremented at:</span> <strong>${this.summary.lastIncrementedAt}</strong>
            </p>`
          : null}

        <!-- -->

        ${this.snapshot
          ? html`<p class="summary-paragraph">
              <span>Summary — count:</span> <strong>${this.snapshot.count}</strong>

              <span>Last incremented at:</span> <strong>${this.snapshot.lastIncrementedAt}</strong>
              <span>Fetched at:</span> <strong>${this.snapshot.fetchedAt}</strong>
            </p>`
          : null}
      </div>
    `;
  }
}
