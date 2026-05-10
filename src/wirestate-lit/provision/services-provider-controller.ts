import { ContextConsumer } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  applySeeds,
  bindEntry,
  getEntryToken,
  InjectableDescriptor,
  SeedEntries,
  unapplySeeds,
  Newable,
  ServiceIdentifier,
  WirestateError,
} from "@wirestate/core";
import { Callable } from "@wirestate/core/types/general";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext, IocContext } from "../context/ioc-context";
import { Maybe } from "../types/general";

/**
 * Options for the {@link ServicesProviderController}.
 *
 * @group provision
 */
export interface ServicesProviderControllerOptions {
  /**
   * List of service entries to bind to the container.
   */
  entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;
  /**
   * Target IoC context to bind services into.
   * If not provided, it will use the context from the nearest provider.
   */
  into?: IocContext | (() => IocContext);
  /**
   * List of service identifiers to activate (get from container) immediately.
   */
  activate?: ReadonlyArray<ServiceIdentifier>;
  /**
   * Seed data to apply to the container.
   */
  seeds?: SeedEntries;
}

/**
 * Controller that binds services to an IoC container when the host connects.
 *
 * It automatically unbinds the services when the host disconnects.
 *
 * @group provision
 */
export class ServicesProviderController<E extends ReactiveControllerHost & HTMLElement> implements ReactiveController {
  public readonly consumer: ContextConsumer<typeof ContainerContext, E>;
  public readonly entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;

  public readonly activate: Maybe<ReadonlyArray<ServiceIdentifier>>;
  public readonly seeds: Maybe<SeedEntries>;
  public readonly into: Maybe<IocContext | Callable<IocContext>>;

  /**
   * @param host - the host element
   * @param options - provisioning options
   * @param options.entries - list of service entries to bind to the container
   * @param options.into - target IoC context to bind services into, if not provided, it will use the context from the nearest provider
   * @param options.activate - list of service identifiers to activate (get from container) immediately
   * @param options.seeds - seed data to apply to the container
   */
  public constructor(
    private readonly host: E,
    options: ServicesProviderControllerOptions
  ) {
    dbg.info(prefix(__filename), "Construct:", {
      host,
      options,
    });

    this.host.addController(this);

    this.entries = options.entries;
    this.activate = options.activate;
    this.seeds = options.seeds;
    this.into = options.into;

    this.consumer = new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (it) => dbg.info(prefix(__filename), "container changed", it),
    });
  }

  public hostConnected(): void {
    const context: Maybe<IocContext> = this.into
      ? typeof this.into === "function"
        ? this.into()
        : this.into
      : this.consumer.value;

    dbg.info(prefix(__filename), "Host connected:", {
      consumerValue: this.consumer.value,
      containerResolver: this.into,
      container: context,
    });

    if (!context) {
      if (this.consumer["provided"] === false) {
        throw new WirestateError(-1, "not provided");
      }

      throw new WirestateError(-1, "todo");
    }

    dbg.info(prefix(__filename), "Binding seeds and entries");

    // Seed must be applied BEFORE binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
    if (this.seeds) {
      applySeeds(context.container, this.seeds);
    }

    for (const entry of this.entries) {
      bindEntry(context.container, entry);
    }

    if (this.activate) {
      for (const eager of this.activate) {
        context.container.get(eager);
      }
    }
  }

  public hostDisconnected(): void {
    const context: Maybe<IocContext> = this.into
      ? typeof this.into === "function"
        ? this.into()
        : this.into
      : this.consumer.value;

    dbg.info(prefix(__filename), "Host disconnected:", {
      consumerValue: this.consumer.value,
      containerResolver: this.into,
      container: context,
    });

    if (!context) {
      throw new WirestateError(-1, "todo");
    }

    for (const entry of this.entries) {
      const token: ServiceIdentifier = getEntryToken(entry);

      context.container.unbind(token);
    }

    // Remove only this provider's targeted initial state entries.
    if (this.seeds) {
      unapplySeeds(context.container, this.seeds);
    }
  }
}
