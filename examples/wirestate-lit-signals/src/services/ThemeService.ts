import { Inject, Injectable, OnActivated, OnDeactivation, SEED, WireScope } from "@wirestate/core";
import { signal, State } from "@wirestate/lit-signals";

import { EGlobalEvent } from "@/constants/events";

@Injectable()
export class ThemeService {
  public theme: State<string> = signal("light");

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(SEED)
    protected readonly seed: object
  ) {
    console.info(`[${this.constructor.name}] Shared seed on construction:`, seed);
    document.documentElement.dataset.theme = this.theme.get();
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated with theme:`, this.theme.get());

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitEvent(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.scope.emitEvent(`deactivating/${this.constructor.name}`);
  }

  public toggleTheme(): void {
    this.theme.set(this.theme.get() === "light" ? "dark" : "light");

    document.documentElement.dataset.theme = this.theme.get();

    this.scope.emitEvent(EGlobalEvent.THEME_TOGGLED, {
      theme: this.theme.get(),
    });
  }
}
