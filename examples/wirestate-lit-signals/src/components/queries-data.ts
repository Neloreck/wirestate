import { injection, useInjection } from "@wirestate/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { LoggerService } from "@/services/LoggerService";

@customElement("w-queries-data")
export class QueriesData extends LitElement {
  private readonly loggerServiceController = useInjection(this, {
    injectionId: LoggerService,
  });

  @injection({ injectionId: LoggerService })
  private readonly loggerService!: LoggerService;

  public render() {
    console.info(`[${this.constructor.name}] render:`, {
      loggerService: this.loggerService,
      loggerServiceController: this.loggerServiceController,
    });

    return html`<div>todo: custom element - queries data</div>`;
  }
}
