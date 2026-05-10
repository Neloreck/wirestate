import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import { createIocContainer, Container, applySharedSeed } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { IocContextObject, IocContext } from "../context/ioc-context";
import { AnyObject } from "../types/general";

/**
 * Options for the {@link IocProviderController}.
 *
 * @group provision
 */
export interface IocProviderControllerOptions {
  /**
   * Optional existing container to use. If not provided, a new one will be created.
   */
  container?: Container;
  /**
   * Optional seed data to apply to the container.
   */
  seed?: AnyObject;
}

/**
 * Controller that provides an IoC container context to the host element and its children.
 *
 * It manages the lifecycle of the container and handles revision updates to notify consumers.
 *
 * @group provision
 */
export class IocProviderController<
  E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement,
> implements ReactiveController {
  protected readonly provider: ContextProvider<typeof IocContextObject>;
  protected readonly seed?: AnyObject;
  protected revision: number = 1;

  /**
   * The managed Inversify IoC container.
   */
  public container: Container;

  /**
   * @returns current {@link IocContext} value served to child consumers
   */
  public get value(): IocContext {
    return this.provider.value;
  }

  /**
   * @param host - the host element
   * @param options - provisioning options
   * @param options.container - optional existing container to use. If not provided, a new one will be created
   * @param options.seed - optional seed data to apply to the container
   */
  public constructor(
    private readonly host: E,
    { container, seed }: IocProviderControllerOptions = {}
  ) {
    this.host.addController(this);

    this.container = container ?? createIocContainer();
    this.seed = seed;

    dbg.info(prefix(__filename), "Constructing:", {
      host: this.host,
      container: this.container,
      initContainer: container,
      revision: this.revision,
    });

    this.provider = new ContextProvider(host, {
      context: IocContextObject,
      initialValue: {
        container: this.container,
        revision: this.revision,
        nextRevision: () => this.nextRevision(),
      },
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected");

    if (this.seed) {
      dbg.info(prefix(__filename), "Apply shared seed:", {
        container: this.container,
        seed: this.seed,
      });

      applySharedSeed(this.container, this.seed);
    }
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected");
  }

  public nextRevision(): number {
    dbg.info(prefix(__filename), "Updating revision:", {
      host: this.host,
      container: this.container,
      fromRevision: this.revision,
      toRevision: this.revision + 1,
    });

    this.revision += 1;

    this.provider.setValue({
      container: this.container,
      revision: this.revision,
      nextRevision: () => this.nextRevision(),
    });

    return this.revision;
  }
}
