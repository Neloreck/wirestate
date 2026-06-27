import { ContextProvider } from "@lit/context";
import { type ReactiveController, type ReactiveControllerHost } from "@lit/reactive-element";
import { type ContainerConfig, Container, WirestateError, validateContainerConfig } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { type Maybe } from "../types/general";

/**
 * Describes options for {@link ContainerProvider}.
 *
 * @remarks
 * Pass either `container` or `config`. Passing both is an error.
 *
 * @group Provision
 */
export interface ContainerProviderOptions {
  /**
   * External container instance to provide as-is.
   *
   * @remarks
   * External containers are never activated, recreated, or disposed by this
   * provider. They are published through context while the host is connected.
   * Provider lifecycle hooks run while the host is connected.
   */
  readonly container?: Container;

  /**
   * Managed container creation options.
   *
   * @remarks
   * The managed container is created when the host connects, disposed when it
   * disconnects, and recreated on the next reconnect. Managed containers
   * activate all bindings by default unless `activate` is provided explicitly.
   * The provider value is `undefined` while the host is disconnected.
   */
  readonly config?: ContainerConfig;
}

/**
 * Reactive controller that provides a root container through Lit context.
 *
 * @remarks
 * Two modes:
 *
 * - External `container`: published while connected, provisioned, never disposed.
 * - Managed `config`: created on connect, provisioned, disposed on disconnect.
 *
 * Managed containers activate all bindings by default. Before connect and after
 * disconnect, the context value is `undefined`.
 *
 * @group Provision
 *
 * @example
 * ```typescript
 * import { Injectable } from "@wirestate/core";
 * import { ContainerProvider } from "@wirestate/lit";
 * import { LitElement } from "lit";
 *
 * @Injectable()
 * class CounterService {}
 *
 * class AppRoot extends LitElement {
 *   private readonly provider = new ContainerProvider(this, {
 *     config: { bindings: [CounterService] },
 *   });
 * }
 * ```
 */
export class ContainerProvider<E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected config: Maybe<ContainerConfig>;
  protected container: Maybe<Container>;

  /**
   * @param host - The host element.
   * @param options - Provisioning options.
   * @param options.container - External container instance to provide.
   * @param options.config - Managed container creation config.
   */
  public constructor(host: E, options: ContainerProviderOptions) {
    if (!options.container && !options.config) {
      throw new WirestateError(
        "ContainerProvider requires a valid container instance or creation config.",
        ERROR_CODE_INVALID_ARGUMENTS
      );
    } else if (options.container && options.config) {
      throw new WirestateError(
        "ContainerProvider requires only container or valid config object to be provided.",
        ERROR_CODE_INVALID_ARGUMENTS
      );
    } else if (options.config) {
      validateContainerConfig(options.config);
    } else if (!(options.container instanceof Container)) {
      throw new WirestateError(
        "ContainerProvider requires a valid container instance or creation config.",
        ERROR_CODE_INVALID_ARGUMENTS
      );
    }

    super(host, { context: ContainerContext });

    this.config = options.config ? { ...options.config, activate: options.config.activate ?? true } : null;
    this.container = options.container;
  }

  public hostConnected(): void {
    const container: Container = this.config
      ? (this.container = new Container(this.config))
      : (this.container as Container);

    try {
      container.provision();

      super.setValue(container);
      super.hostConnected();
    } catch (error) {
      if (this.config) {
        this.destroyManagedContainer(container);
      } else {
        // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
        container.deprovision();
      }

      throw error;
    }
  }

  public hostDisconnected(): void {
    const container: Container = this.container as Container;

    if (this.config) {
      this.destroyManagedContainer(container);
    } else {
      container.deprovision();
    }

    this.clearCallbacks();
    super.setValue(undefined as unknown as Container);
  }

  /**
   * Replaces the external container published by this provider.
   *
   * @remarks
   * Only external-container providers can use this method. Connected providers
   * deprovision the previous container, provision the new one, and publish it
   * through context. Disconnected providers store the container for the next
   * connection.
   *
   * @param container - External container to publish.
   * @param force - Whether Lit context consumers should be notified even if the value is unchanged.
   *
   * @throws WirestateError If this provider owns managed containers.
   */
  public setValue(container: Container, force?: boolean): void {
    if (this.config) {
      throw new WirestateError(
        "ContainerProvider owns managed containers. Use `setConfig(config)` to replace the managed container.",
        ERROR_CODE_INVALID_ARGUMENTS
      );
    }

    const previous: Maybe<Container> = this.container;

    this.container = container;

    if (this.host.isConnected) {
      if (Object.is(previous, container)) {
        super.setValue(container, force);
      } else {
        if (previous) {
          previous.deprovision();
        }

        try {
          container.provision();

          super.setValue(container, force);
        } catch (error) {
          // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
          container.deprovision();

          throw error;
        }
      }
    }
  }

  /**
   * Replaces the managed container config.
   *
   * @remarks
   * External-container providers cannot switch to managed mode. Connected
   * managed providers replace the current container immediately. Disconnected
   * managed providers store the config for the next connection.
   *
   * @param config - Container creation options to use from now on.
   */
  public setConfig(config: ContainerConfig): void {
    if (!this.config) {
      throw new WirestateError(
        "ContainerProvider uses an external container. Use `setValue(container)` to replace it.",
        ERROR_CODE_INVALID_ARGUMENTS
      );
    }

    validateContainerConfig(config);

    this.config = { ...config, activate: config.activate ?? true };

    if (this.host.isConnected) {
      if (this.container) {
        this.destroyManagedContainer(this.container);
      }

      const container: Container = new Container(this.config);

      this.container = container;

      try {
        container.provision();

        super.setValue(container);
      } catch (error) {
        this.destroyManagedContainer(container);

        throw error;
      }
    }
  }

  /**
   * Destroys the currently owned managed container.
   *
   * @param container - Managed container to deprovision and dispose.
   */
  protected destroyManagedContainer(container: Container): void {
    container.deprovision();

    this.container = null;

    container.unbindAll();
  }
}
