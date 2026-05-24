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
import { signal, Signal } from "@wirestate/react-signals";

import { EGlobalEvent } from "@/constants/events";
import type { Theme } from "@/types";

@Injectable()
export class ThemeService {
  public theme: Signal<Theme> = signal("light");

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(SEED)
    protected readonly seed: object,
  ) {
    console.info(
      `[${this.constructor.name}] Shared seed on construction:`,
      seed,
    );
  }

  @OnActivated()
  public onActivated(): void {
    console.info(
      `[${this.constructor.name}] Activated with theme:`,
      this.theme,
    );
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(
      `[${this.constructor.name}] Provision with theme:`,
      this.theme,
    );

    this.scope.emitEvent(`provision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.scope.emitEvent(`deprovision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  public toggle(): void {
    this.theme.value = this.theme.value === "light" ? "dark" : "light";

    this.scope.emitEvent(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.value,
    });
  }
}
