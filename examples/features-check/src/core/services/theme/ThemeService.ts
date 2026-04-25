import type { Theme } from "@/application/types";
import { EGlobalSignal } from "@/core/signals";
import {
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  SEED,
  WireScope,
} from "@/libs/wirestate";
import { Action, Observable, makeObservable } from "@/libs/wirestate/mobx";

@Injectable()
export class ThemeService {
  @Observable()
  public theme: Theme = "light";

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(SEED)
    protected readonly seed: object,
  ) {
    makeObservable(this);

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

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitSignal(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.scope.emitSignal(`deactivating/${this.constructor.name}`);
  }

  @Action()
  public toggle(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    this.scope.emitSignal(EGlobalSignal.THEME_TOGGLED, { theme: this.theme });
  }
}
