import {
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnDeprovision,
  OnProvision,
  SEED,
  WireScope,
} from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { Theme } from "@/types";

@Injectable()
export class ThemeService {
  public theme: Signal<Theme> = signal("light");

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(SEED)
    protected readonly seed: object
  ) {
    console.info(`[${this.constructor.name}] Shared seed on construction:`, seed);
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

    this.scope.emitEvent(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.scope.emitEvent(`deprovision/${this.constructor.name}`);
  }

  public toggleTheme(): void {
    this.theme.value = this.theme.value === "light" ? "dark" : "light";

    document.documentElement.dataset.theme = this.theme.value;

    this.scope.emitEvent(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.value,
    });
  }
}
