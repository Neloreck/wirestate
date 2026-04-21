import type { Theme } from "@/application/types";
import { EGlobalSignal } from "@/core/signals";
import {
  AbstractService,
  Action,
  INITIAL_STATE,
  Inject,
  Injectable,
  makeObservable,
  Observable,
} from "@/libs/wirestate";

@Injectable()
export class ThemeService extends AbstractService {
  @Observable()
  public theme: Theme = "light";

  public constructor(
    @Inject(INITIAL_STATE)
    protected readonly initialState: object,
  ) {
    super();

    makeObservable(this);

    console.info(
      `[${this.constructor.name}] Shared initial state on construction:`,
      initialState,
    );
  }

  public override onActivated(): void {
    console.info(
      `[${this.constructor.name}] Activated with theme:`,
      this.theme,
    );
  }

  public override onDeactivated(): void {
    console.info(`[${this.constructor.name}] Deactivated`);
  }

  @Action()
  public toggle(): void {
    this.theme = this.theme === "light" ? "dark" : "light";

    this.emitSignal({
      type: EGlobalSignal.THEME_TOGGLED,
      payload: { theme: this.theme },
    });
  }
}
