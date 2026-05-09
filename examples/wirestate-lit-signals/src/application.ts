import "reflect-metadata";
import "@/components/general-controls";
import "@/components/events-log";
import "@/components/queries-data";
import "@/styles/index.css";

import { BindingType, ScopeBindingType } from "@wirestate/core";
import { ContainerProviderController, ServicesProviderController } from "@wirestate/lit";
import { LitElement, html, css, CSSResult, TemplateResult } from "lit";
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
        text-align: center;
        border-inline: 1px solid var(--border);
        min-height: 100svh;
        box-sizing: border-box;
      }
    `,
  ];

  public iocProviderController = new ContainerProviderController(this);

  public containersProviderController = new ServicesProviderController(this, {
    entries: [
      LoggerService,
      CounterService,
      ThemeService,
      // [*] Pass DI check - allow injecting static values / configs.
      {
        id: GLOBAL_CONFIG,
        value: { first: 1, second: 2, third: null, random: Math.random() },
      },
      // [*] Pass DI check - allow injecting dynamic values / configs.
      {
        id: GLOBAL_DYNAMIC_CONFIG,
        value: { random: Math.random(), another: true },
        bindingType: BindingType.DynamicValue,
        scopeBindingType: ScopeBindingType.Singleton,
      },
    ],
    activate: [LoggerService],
    seeds: [
      [CounterService, { count: 10 }],
      [LoggerService, { enabled: true }],
    ],
    into: () => this.iocProviderController.provider.value,
  });

  public render(): TemplateResult {
    return html`
      <w-general-controls></w-general-controls>
      <w-events-log></w-events-log>
      <w-queries-data></w-queries-data>
    `;
  }
}
