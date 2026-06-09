import "@/styles/index.css";

import "reflect-metadata";

import "@/components/general-controls";
import "@/components/events-log";
import "@/components/queries-data";

import { BindingType, BindingScope } from "@wirestate/core";
import { ContainerProvider, provideContainer } from "@wirestate/lit";
import { LitElement, html, CSSResult, TemplateResult, css } from "lit";
import { customElement } from "lit/decorators.js";

import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

@customElement("w-application")
export class Application extends LitElement {
  public static styles: Array<CSSResult> = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 1126px;
        max-width: 100%;
        margin: 0 auto;
        padding: var(--space-4);
        gap: var(--space-4);
        box-sizing: border-box;
      }

      .app-header {
        text-align: center;
        padding: var(--space-2) 0;
      }

      .app-header h1 {
        margin-bottom: var(--space-2);
        font-family: var(--heading);
        font-weight: 500;
        font-size: 48px;
        color: var(--text-h);
      }

      .app-header__stack {
        display: inline-block;
        margin-top: var(--space-3);
        font-family: var(--mono);
        font-size: var(--text-sm);
        color: var(--accent);
        background: var(--accent-bg);
        border: 1px solid var(--accent-border);
        border-radius: 999px;
        padding: 2px 14px;
      }

      .app-header__lead {
        margin: 0 auto;
        max-width: 60ch;
        color: var(--text);
      }

      .panel {
        border: 1px solid var(--border);
        border-radius: var(--border-radius-lg);
        padding: var(--space-4);
        background: var(--social-bg);
        text-align: left;
      }

      .panel > h2 {
        margin: 0 0 var(--space-1);
        font-family: var(--heading);
        font-weight: 500;
        font-size: 22px;
        color: var(--text-h);
      }

      .panel__desc {
        margin: 0 0 var(--space-3);
        font-size: 14px;
        color: var(--text);
      }
    `,
  ];

  @provideContainer({
    config: {
      seeds: [
        [LoggerService, { enabled: true }],
        [CounterService, { count: 25 }],
      ],
      bindings: [
        LoggerService,
        CounterService,
        ThemeService,
        {
          token: GLOBAL_CONFIG,
          value: { first: 1, second: 2, third: null, random: Math.random() },
        },
        {
          token: GLOBAL_DYNAMIC_CONFIG,
          factory: () => ({ random: Math.random(), another: true }),
          type: BindingType.DynamicValue,
          scope: BindingScope.Singleton,
        },
      ],
    },
  })
  public readonly containerProvider!: ContainerProvider;

  public render(): TemplateResult {
    return html`
      <header class="app-header">
        <h1>Wirestate</h1>
        <p class="app-header__stack">Lit + Signals</p>
        <p class="app-header__lead">
          Dependency-injected services with events, commands, queries, and reactive Preact Signals state.
        </p>
      </header>

      <section class="panel">
        <h2>Counter &amp; controls</h2>
        <p class="panel__desc">
          State lives in injected services. Buttons call service methods, emit events, and run a command.
        </p>
        <w-general-controls></w-general-controls>
      </section>

      <section class="panel">
        <h2>Events log</h2>
        <p class="panel__desc">LoggerService records every event emitted inside the container.</p>
        <w-events-log></w-events-log>
      </section>

      <section class="panel">
        <h2>Queries</h2>
        <p class="panel__desc">Pull data from service query handlers — synchronously or async.</p>
        <w-queries-data></w-queries-data>
      </section>
    `;
  }
}
