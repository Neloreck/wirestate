import { Injectable, OnActivated, OnDeactivation, OnDeprovision, OnProvision, inject, EventBus } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { Theme } from "@/types";

@Injectable()
export class ThemeService {
  public theme: Signal<Theme> = signal(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  public constructor(private readonly eventBus: EventBus = inject(EventBus)) {
    document.documentElement.dataset.theme = this.theme.value;
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
    console.info(`[${this.constructor.name}] Provision with theme:`, this.theme.value);

    this.eventBus.emit(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`);
  }

  public toggleTheme(): void {
    this.theme.value = this.theme.value === "light" ? "dark" : "light";

    document.documentElement.dataset.theme = this.theme.value;

    this.eventBus.emit(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.value,
    });
  }
}
