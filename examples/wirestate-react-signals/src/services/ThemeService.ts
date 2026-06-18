import { Injectable, OnActivated, OnDeactivation, OnDeprovision, OnProvision, inject, EventBus } from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { type Theme } from "@/types";

@Injectable()
export class ThemeService {
  public theme: Signal<Theme> = signal(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  public constructor(private readonly eventBus: EventBus = inject(EventBus)) {}

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

  public toggle(): void {
    this.theme.value = this.theme.value === "light" ? "dark" : "light";

    this.eventBus.emit(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.value,
    });
  }
}
