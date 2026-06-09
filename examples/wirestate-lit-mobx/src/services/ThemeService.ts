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
import { Action, makeObservable, Observable } from "@wirestate/mobx";

import { EGlobalEvent } from "@/constants/events";
import { Theme } from "@/types";

@Injectable()
export class ThemeService {
  @Observable()
  public theme: Theme = "light";

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(SEED)
    protected readonly seed: object
  ) {
    makeObservable(this);

    console.info(`[${this.constructor.name}] Shared seed on construction:`, seed);
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

    this.scope.emitEvent(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.scope.emitEvent(`deprovision/${this.constructor.name}`);
  }

  @Action()
  public toggleTheme(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    document.documentElement.dataset.theme = this.theme;

    this.scope.emitEvent(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme,
    });
  }
}
