import { ContextConsumer, ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  Container,
  createContainer,
  InjectableDescriptor,
  Newable,
  SeedEntries,
  ServiceIdentifier,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { Maybe } from "../types/general";

/**
 * Represents options for the {@link SubContainerProviderController}.
 *
 * @group Provision
 */
export interface SubContainerProviderControllerOptions {
  /**
   * Managed child-container creation options.
   *
   * @remarks
   * The child container is created from the current parent context when the
   * host connects, destroyed when the host disconnects, and recreated when the
   * parent context changes or the host reconnects.
   */
  readonly options: {
    /**
     * List of service entries to bind to the container.
     */
    readonly entries: ReadonlyArray<Newable<object> | InjectableDescriptor>;

    /**
     * List of service identifiers to activate (get from container) immediately after binding.
     */
    readonly activate?: ReadonlyArray<ServiceIdentifier>;

    /**
     * Seed data to apply to the container before binding.
     * Applied before entries are bound so that `@Inject(SEEDS_TOKEN)` works during activation.
     */
    readonly seeds?: SeedEntries;
  };
}

/**
 * Controller that provides a managed child container for the host element's lifetime.
 *
 * @remarks
 * The controller always owns a child container derived from the nearest parent
 * {@link ContainerContext}. When connected, it creates a child container using
 * the latest parent context, provides it to descendants, destroys it when the
 * host disconnects, and replaces it whenever the parent container changes.
 *
 * @group Provision
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private container = new SubContainerProviderController(this, {
 *     options: {
 *       entries: [AuthService, UserService],
 *       activate: [AuthService],
 *       seeds: [[AuthService, { role: "admin" }]],
 *     },
 *   });
 * }
 * ```
 */
export class SubContainerProviderController<
  E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement,
>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected readonly consumer: ContextConsumer<typeof ContainerContext, E>;
  protected readonly options: SubContainerProviderControllerOptions["options"];

  protected parent: Maybe<Container> = null;
  protected destroyed: boolean = true;

  /**
   * @param host - The host element.
   * @param options - Provisioning options, including child entries, eager activations, and seeds.
   */
  public constructor(host: E, options: SubContainerProviderControllerOptions) {
    super(host, {
      context: ContainerContext,
    });

    dbg.info(prefix(__filename), "Constructing:", { host, options });

    this.options = options.options;

    this.consumer = new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (context: Container) => {
        const previousParent: Maybe<Container> = this.parent;

        this.parent = context;

        if (host.isConnected) {
          dbg.info(prefix(__filename), "Context received from consumer:", {
            parent: context,
            previousParent,
          });

          if (this.destroyed || !this.value || previousParent !== context) {
            this.destroyContainer();
            this.createContainer();
          }
        } else {
          dbg.info(prefix(__filename), "Context received from consumer on disconnected:", {
            parent: context,
            previousParent,
          });
        }
      },
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected:", {
      parent: this.parent,
      container: this.value,
      destroyed: this.destroyed,
    });

    if (this.parent && (this.destroyed || !this.value)) {
      this.destroyContainer();
      this.createContainer();
    }

    super.hostConnected();
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", {
      parent: this.parent,
      container: this.value,
      destroyed: this.destroyed,
    });

    this.destroyContainer();
  }

  /**
   * Replaces the currently provided child container with a new one derived
   * from the latest parent context.
   */
  protected createContainer(): void {
    const container: Container = createContainer({
      ...this.options,
      parent: this.parent as Container,
    });

    dbg.info(prefix(__filename), "Creating container:", {
      parent: this.parent,
      options: this.options,
      container,
    });

    this.destroyed = false;
    this.value = container;
  }

  /**
   * Destroys the currently provided child container.
   */
  protected destroyContainer(): void {
    if (this.value && !this.destroyed) {
      dbg.info(prefix(__filename), "Destroying container:", {
        parent: this.parent,
        container: this.value,
      });

      this.value.unbindAll();
      this.destroyed = true;
    }
  }
}
