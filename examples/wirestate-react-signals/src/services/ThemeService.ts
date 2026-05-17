import {
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
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
      this.theme.value,
    );

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitEvent(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.scope.emitEvent(`deactivating/${this.constructor.name}`);
  }

  public toggle(): void {
    this.theme.value = this.theme.value === "light" ? "dark" : "light";

    this.scope.emitEvent(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.value,
    });
  }
}
