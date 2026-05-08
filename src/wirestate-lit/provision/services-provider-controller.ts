import { ContextConsumer } from "@lit/context";
import {
  applySeeds,
  bindEntry,
  getEntryToken,
  InjectableDescriptor,
  SeedEntries,
  unapplySeeds,
  Container,
  Newable,
  ServiceIdentifier,
} from "@wirestate/core";
import { Callable } from "@wirestate/core/types/general";
import { LitElement, ReactiveController, ReactiveControllerHost } from "lit";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Maybe } from "../types/general";

import { ContainerContext } from "./ioc-provider-context";

export class ServicesProviderController implements ReactiveController {
  public readonly consumer: ContextConsumer<typeof ContainerContext, LitElement>;
  public readonly entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;

  public readonly activate: Maybe<ReadonlyArray<ServiceIdentifier>>;
  public readonly seeds: Maybe<SeedEntries>;
  public readonly container: Maybe<Container | Callable<Container>>;

  public constructor(
    private readonly host: ReactiveControllerHost & LitElement,
    options: {
      entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;
      container?: Container | (() => Container);
      activate?: ReadonlyArray<ServiceIdentifier>;
      seeds?: SeedEntries;
    }
  ) {
    dbg.info(prefix(__filename), "Construct:", {
      host,
      options,
    });

    this.host.addController(this);

    this.entries = options.entries;
    this.activate = options.activate;
    this.seeds = options.seeds;
    this.container = options.container;

    this.consumer = new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (it) => dbg.info(prefix(__filename), "container changed", it),
    });
  }

  public hostConnected(): void {
    const container: Maybe<Container> = this.container
      ? typeof this.container === "function"
        ? this.container()
        : this.container
      : this.consumer.value;

    dbg.info(prefix(__filename), "Host connected:", {
      consumerValue: this.consumer.value,
      containerResolver: this.container,
      container,
    });

    if (!container) {
      if (this.consumer["provided"] === false) {
        throw new Error("not provided");
      }

      throw new Error("todo");
    }

    dbg.info(prefix(__filename), "Binding seeds and entries");

    // Seed must be applied BEFORE binding so @Inject(INITIAL_STATE_TOKEN) works during activation.
    if (this.seeds) {
      applySeeds(container, this.seeds);
    }

    for (const entry of this.entries) {
      bindEntry(container, entry);
    }

    if (this.activate) {
      for (const eager of this.activate) {
        container.get(eager);
      }
    }
  }

  public hostDisconnected(): void {
    const container: Maybe<Container> = this.container
      ? typeof this.container === "function"
        ? this.container()
        : this.container
      : this.consumer.value;

    dbg.info(prefix(__filename), "Host disconnected:", {
      consumerValue: this.consumer.value,
      containerResolver: this.container,
      container,
    });

    if (!container) {
      throw new Error("todo");
    }

    for (const entry of this.entries) {
      const token: ServiceIdentifier = getEntryToken(entry);

      container.unbind(token);
    }

    // Remove only this provider's targeted initial state entries.
    if (this.seeds) {
      unapplySeeds(container, this.seeds);
    }
  }
}
