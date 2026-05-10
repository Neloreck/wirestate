import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  applySeeds,
  bindEntry,
  getEntryToken,
  InjectableDescriptor,
  Newable,
  SeedEntries,
  ServiceIdentifier,
  unapplySeeds,
  WirestateError,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Callable } from "../../wirestate-react/types/general";
import { IocContextObject, IocContext } from "../context/ioc-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Options for the {@link InjectablesProviderController}.
 *
 * @group provision
 */
export interface InjectablesProviderControllerOptions {
  /**
   * List of service entries to bind to the container.
   */
  entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;
  /**
   * Target IoC context to bind injectables into.
   * If not provided, uses the context from the nearest provider.
   * Accepts a static {@link IocContext} reference or a resolver function.
   */
  into?: IocContext | Callable<IocContext>;
  /**
   * List of service identifiers to activate (get from container) immediately after binding.
   */
  activate?: ReadonlyArray<ServiceIdentifier>;
  /**
   * Seed data to apply to the container before binding.
   * Applied before entries are bound so that `@Inject(SEEDS_TOKEN)` works during activation.
   */
  seeds?: SeedEntries;
}

/**
 * Controller that binds a set of injectables to an IoC container when the host connects
 * and unbinds them when the host disconnects.
 *
 * When no `into` context is provided, the controller uses the nearest {@link IocProviderController}
 * ancestor via Lit context. Seeds are applied before entries so that `@Inject(SEEDS_TOKEN)`
 * works during service activation.
 *
 * @group provision
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private services = new InjectablesProviderController(this, {
 *     entries: [AuthService, UserService],
 *     activate: [AuthService],
 *     seeds: [[AuthService, { role: "admin" }]],
 *   });
 * }
 * ```
 */
export class InjectablesProviderController<
  E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement,
> implements ReactiveController {
  protected readonly consumer?: ContextConsumer<typeof IocContextObject, E>;

  private readonly entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;
  private readonly activate: Maybe<ReadonlyArray<ServiceIdentifier>>;
  private readonly seeds: Maybe<SeedEntries>;
  private readonly into: Maybe<IocContext | Callable<IocContext>>;

  /**
   * Tracks the context to which entries are currently bound, for correct cleanup on disconnect.
   */
  private boundContext: Maybe<IocContext> = null;

  /**
   * @param host - the host element
   * @param options - provisioning options
   * @param options.entries - list of service entries to bind to the container
   * @param options.into - target IoC context; if omitted, uses the nearest provider context
   * @param options.activate - list of service identifiers to activate immediately after binding
   * @param options.seeds - seed data applied before binding
   */
  public constructor(
    private readonly host: E,
    options: InjectablesProviderControllerOptions
  ) {
    dbg.info(prefix(__filename), "Construct:", { host, options });

    this.host.addController(this);

    this.entries = options.entries;
    this.activate = options.activate ?? null;
    this.seeds = options.seeds ?? null;
    this.into = options.into ?? null;

    if (!this.into) {
      // subscribe: false — binding happens once per connect, not on every revision update.
      this.consumer = new ContextConsumer(host, {
        context: IocContextObject,
        subscribe: false,
        callback: (context) => {
          if (!host.isConnected) {
            return;
          }

          dbg.info(prefix(__filename), "Context received from consumer:", context);

          this.bind(context);
        },
      });
    }
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected:", { into: this.into });

    if (!this.into) {
      // ContextConsumer with subscribe:false only invokes the user callback once (provided flag stays true
      // after disconnect). On reconnect we fall back to the cached consumer.value so bind() still fires.
      if (this.consumer?.value) {
        this.bind(this.consumer.value);
      }

      return;
    }

    const context: Maybe<IocContext> = typeof this.into === "function" ? this.into() : this.into;

    if (!context) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "InjectablesProviderController: the 'into' option resolved to null or undefined. " +
          "Ensure the value or resolver function returns a valid IocContext."
      );
    }

    this.bind(context);
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", { boundContext: this.boundContext });

    if (!this.boundContext) {
      return;
    }

    this.unbind(this.boundContext);
  }

  private bind(context: IocContext): void {
    if (this.boundContext) {
      // Re-binding without unbinding first would leave stale entries; unbind the previous context.
      this.unbind(this.boundContext);
    }

    this.boundContext = context;

    dbg.info(prefix(__filename), "Binding entries:", { container: context.container, entries: this.entries });

    // Seeds must be applied before binding so @Inject(SEEDS_TOKEN) resolves during activation.
    if (this.seeds) {
      applySeeds(context.container, this.seeds);
    }

    for (const entry of this.entries) {
      bindEntry(context.container, entry);
    }

    if (this.activate) {
      for (const token of this.activate) {
        context.container.get(token);
      }
    }
  }

  private unbind(context: IocContext): void {
    dbg.info(prefix(__filename), "Unbinding entries:", { container: context.container, entries: this.entries });

    for (const entry of this.entries) {
      const token: ServiceIdentifier = getEntryToken(entry);

      if (context.container.isBound(token)) {
        context.container.unbind(token);
      }
    }

    if (this.seeds) {
      unapplySeeds(context.container, this.seeds);
    }

    this.boundContext = null;
  }
}
