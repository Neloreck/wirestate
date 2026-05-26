import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  Container,
  ContainerConfig,
  createContainer,
  deprovisionContainer,
  getContainerEntries,
  provisionContainer,
  type ProvisionLifecycle,
  validateContainerConfig,
  WirestateError,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Represents options for {@link ContainerProvider}.
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
   * activate all entries by default unless `activate` is provided explicitly.
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
 * Managed containers activate all entries by default. Before connect and after
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
 *     config: { entries: [CounterService] },
 *   });
 * }
 * ```
 */
export class ContainerProvider<E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected readonly lifecycle: ProvisionLifecycle = new Map();

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
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProvider requires a valid container instance or creation config."
      );
    } else if (options.container && options.config) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProvider requires only container or valid config object to be provided."
      );
    } else if (options.config) {
      validateContainerConfig(options.config);
    } else if (!(options.container instanceof Container)) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProvider requires a valid container instance or creation config."
      );
    }

    super(host, { context: ContainerContext });

    this.config = options.config ? { ...options.config, activate: options.config.activate ?? true } : null;
    this.container = options.container;

    dbg.info(prefix(__filename), "Constructed:", {
      host: this.host,
      container: this.container,
      options: this.config,
    });
  }

  public hostConnected(): void {
    const container: Container = this.config
      ? (this.container = createContainer(this.config))
      : (this.container as Container);

    super.setValue(container);

    provisionContainer(container, this.lifecycle, getContainerEntries(container));

    super.hostConnected();
  }

  public hostDisconnected(): void {
    const container: Container = this.container as Container;

    if (this.config) {
      this.destroyManagedContainer(container);
    } else {
      deprovisionContainer(container, this.lifecycle);
    }

    this.clearCallbacks();
    super.setValue(undefined as unknown as Container);
  }

  public setValue(container: Container, force?: boolean): void {
    if (this.config) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProvider owns managed containers. Use `setConfig(config)` to replace the managed container."
      );
    }

    const previous: Maybe<Container> = this.container;

    this.container = container;

    if (this.host.isConnected) {
      if (Object.is(previous, container)) {
        super.setValue(container, force);
      } else {
        if (previous) {
          deprovisionContainer(previous, this.lifecycle);
        }

        super.setValue(container, force);

        provisionContainer(container, this.lifecycle, getContainerEntries(container));
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
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProvider uses an external container. Use `setValue(container)` to replace it."
      );
    }

    validateContainerConfig(config);

    this.config = { ...config, activate: config.activate ?? true };

    if (this.host.isConnected) {
      if (this.container) {
        this.destroyManagedContainer(this.container);
      }

      const container: Container = createContainer(this.config);

      this.container = container;
      super.setValue(container);

      provisionContainer(container, this.lifecycle, getContainerEntries(container));
    }
  }

  /**
   * Destroys the currently owned managed container.
   *
   * @param container - Managed container to deprovision and dispose.
   */
  protected destroyManagedContainer(container: Container): void {
    deprovisionContainer(container, this.lifecycle);

    dbg.info(prefix(__filename), "Destroying managed container:", {
      container,
    });

    this.container = null;
    container.unbindAll();
  }
}
