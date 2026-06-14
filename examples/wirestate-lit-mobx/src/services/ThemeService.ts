import { Injectable, OnActivated, OnDeactivation, OnDeprovision, OnProvision, inject, EventBus } from "@wirestate/core";
import { Action, makeObservable, Observable } from "@wirestate/mobx";

import { EGlobalEvent } from "@/constants/events";
import { Theme } from "@/types";

@Injectable()
export class ThemeService {
  @Observable()
  public theme: Theme = "light";

  public constructor(private readonly eventBus: EventBus = inject(EventBus)) {
    makeObservable(this);
    document.documentElement.dataset.theme = this.theme;
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(`[${this.constructor.name}] Provision with theme:`, this.theme);

    this.eventBus.emit(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`);
  }

  @Action()
  public toggleTheme(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    document.documentElement.dataset.theme = this.theme;

    this.eventBus.emit(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme,
    });
  }
}
