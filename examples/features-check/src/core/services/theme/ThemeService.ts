import type { Theme } from "@/application/types";
import { EGlobalSignal } from "@/core/signals";
import {
  AbstractService,
  Action,
  Inject,
  Injectable,
  Observable,
  OnActivated,
  OnDeactivation,
  SEED,
  makeObservable,
} from "@/libs/wirestate";

@Injectable()
export class ThemeService extends AbstractService {
  @Observable()
  public theme: Theme = "light";

  public constructor(
    @Inject(SEED)
    protected readonly seed: object,
  ) {
    super();

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
    this.emitSignal(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.emitSignal(`deactivating/${this.constructor.name}`);
  }

  @Action()
  public toggle(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    this.emitSignal(EGlobalSignal.THEME_TOGGLED, { theme: this.theme });
  }
}
