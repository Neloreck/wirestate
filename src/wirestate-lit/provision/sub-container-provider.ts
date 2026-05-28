import { ContextConsumer, ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  Bindings,
  Container,
  ContainerActivation,
  SeedBindings,
  WirestateError,
  createContainer,
  deprovisionContainer,
  getContainerBindings,
  provisionContainer,
  type ProvisionLifecycle,
  validateContainerConfig,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Represents options for {@link SubContainerProvider}.
 *
 * @group Provision
 */
export interface SubContainerProviderOptions {
  /**
   * Managed child-container creation options.
   *
   * @remarks
   * The child container is created from the current parent context when the
   * host connects, destroyed when the host disconnects, and recreated when the
   * parent context changes or the host reconnects. The provider value is
   * `undefined` while the host is disconnected.
   */
  readonly config: {
    /**
     * Services or descriptors bound inside the child container.
     */
    readonly bindings: Bindings;

    /**
     * Services to activate (get from container) immediately after binding.
     *
     * @remarks
     * Defaults to `true`, activating all provided bindings. Pass `false` to skip
     * eager activation, or pass an array to activate specific bindings.
     */
    readonly activate?: ContainerActivation;

    /**
     * Seed data to apply to the container before binding.
     * Applied before bindings are bound so that `@Inject(SEEDS_TOKEN)` works during activation.
     */
    readonly seeds?: SeedBindings;
  };
}

/**
 * Reactive controller that provides a managed child container.
 *
 * @remarks
 * The child container inherits parent bindings but owns its own buses, seeds,
 * and lifecycle. It is recreated when the parent container changes.
 *
 * Child containers activate all bindings by default unless `activate` is set.
 * Before connect and after disconnect, the context value is `undefined`.
 *
 * @group Provision
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private container = new SubContainerProvider(this, {
 *     config: {
 *       bindings: [AuthService, UserService],
 *       seeds: [[AuthService, { role: "admin" }]],
 *     },
 *   });
 * }
 * ```
 */
export class SubContainerProvider<E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected readonly lifecycle: ProvisionLifecycle = new Map();

  protected readonly consumer: ContextConsumer<typeof ContainerContext, E>;
  protected config: SubContainerProviderOptions["config"];

  protected parent: Maybe<Container> = null;
  protected destroyed: boolean = true;

  /**
   * @param host - The host element.
   * @param options - Provisioning options, including child bindings, eager activations, and seeds.
   */
  public constructor(host: E, options: SubContainerProviderOptions) {
    super(host, {
      context: ContainerContext,
    });

    dbg.info(prefix(__filename), "Constructing:", { host, options });

    validateContainerConfig(options.config);

    this.config = { ...options.config, activate: options.config.activate ?? true };

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

    super.hostConnected();
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", {
      parent: this.parent,
      container: this.value,
      destroyed: this.destroyed,
    });

    this.destroyContainer();

    this.clearCallbacks();
    super.setValue(undefined as unknown as Container);
  }

  public setValue(container: Container, force?: boolean): void {
    void container;
    void force;

    throw new WirestateError(
      ERROR_CODE_INVALID_ARGUMENTS,
      "SubContainerProvider owns its child container. Use `setConfig(config)` to replace the managed child container."
    );
  }

  /**
   * Replaces the managed child-container config.
   *
   * @remarks
   * When the provider is not currently provisioning a child container, the
   * config is stored for the next connect. When it is active, the current child
   * container is deprovisioned, destroyed, and recreated from the new config.
   *
   * @param config - Child-container creation options to use from now on.
   */
  public setConfig(config: SubContainerProviderOptions["config"]): void {
    validateContainerConfig(config);

    this.config = { ...config, activate: config.activate ?? true };

    if (this.host.isConnected && !this.destroyed) {
      this.destroyContainer();
      this.createContainer();
    }
  }

  /**
   * Replaces the currently provided child container with a new one derived
   * from the latest parent context.
   */
  protected createContainer(): void {
    const container: Container = createContainer({
      ...this.config,
      parent: this.parent as Container,
    });

    dbg.info(prefix(__filename), "Creating container:", {
      parent: this.parent,
      config: this.config,
      container,
    });

    this.destroyed = false;
    super.setValue(container);

    provisionContainer(container, this.lifecycle, getContainerBindings(container));
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

      deprovisionContainer(this.value, this.lifecycle);

      this.value.unbindAll();
      this.destroyed = true;
    }
  }
}
