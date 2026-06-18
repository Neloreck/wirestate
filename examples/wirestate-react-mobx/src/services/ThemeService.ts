import { EventBus, Injectable, OnActivated, OnDeactivation, OnDeprovision, OnProvision, inject } from "@wirestate/core";
import { Observable, makeObservable, BoundAction } from "@wirestate/mobx";

import { EGlobalEvent } from "@/constants/events";
import { type Theme } from "@/types";

@Injectable()
export class ThemeService {
  @Observable()
  public theme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  public constructor(private readonly eventBus: EventBus = inject(EventBus)) {
    makeObservable(this);
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated with theme:`, this.theme);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(`[${this.constructor.name}] Provision with theme:`, this.theme);

    this.eventBus.emit(`provision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  @BoundAction()
  public toggle(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    this.eventBus.emit(EGlobalEvent.THEME_TOGGLED, { theme: this.theme });
  }
}
