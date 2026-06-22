import { Injectable } from "@wirestate/core";

import { Logger } from "@/lib/logging";

/**
 * Chrome-facing transport for the panel: opens worker ports and reports page navigations.
 */
@Injectable()
export class PanelTransport {
  private logger: Logger = new Logger(PanelTransport.name);

  public get tabId(): number {
    return chrome.devtools.inspectedWindow.tabId;
  }

  public openPort(name: string): chrome.runtime.Port {
    this.logger.info("Port opened:", name);

    return chrome.runtime.connect({ name });
  }

  public onNavigated(callback: () => void): void {
    this.logger.info("On navigated:", this.tabId);
    chrome.devtools.network.onNavigated.addListener(callback);
  }
}
