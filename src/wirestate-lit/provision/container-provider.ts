import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  Container,
  ContainerConfig,
  ContainerProvisionLifecycle,
  WirestateError,
  deprovisionContainer,
  provisionContainer,
  validateContainerConfig,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Provider messaging scope modes.
 *
 * @group Provision
 */
export enum ContainerProviderScope {
  /**
   * Create container-local message buses for managed containers.
   */
  Container = "container",

  /**
   * Inherit message buses from the managed container's parent.
   */
  Parent = "parent",
}

/**
 * String value accepted by {@link ContainerProviderOptions.scope}.
 *
 * @group Provision
 */
export type ContainerProviderScopeValue = `${ContainerProviderScope}`;

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

  /**
   * Managed container messaging scope.
   *
   * @remarks
   * Defaults to `"container"`. Pass `"parent"` with a parent container in
   * `config.parent` to inherit the parent's `EventBus`, `CommandBus`, and
   * `QueryBus`.
   */
  readonly scope?: Maybe<ContainerProviderScopeValue>;
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
  protected readonly lifecycle: ContainerProvisionLifecycle = new Map();

  protected config: Maybe<ContainerConfig>;
  protected container: Maybe<Container>;
  protected scope: Maybe<ContainerProviderScopeValue>;

  /**
   * @param host - The host element.
   * @param options - Provisioning options.
   * @param options.container - External container instance to provide.
   * @param options.config - Managed container creation config.
   * @param options.scope - Managed container messaging scope.
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
    this.scope = options.scope;

    dbg.info(prefix(__filename), "Constructed:", {
      host: this.host,
      container: this.container,
      options: this.config,
      scope: this.scope,
    });
  }

  public hostConnected(): void {
    const container: Container = this.config
      ? (this.container = new Container(this.config, {
          skipMessaging: this.scope === ContainerProviderScope.Parent,
        }))
      : (this.container as Container);

    try {
      provisionContainer(container, this.lifecycle);

      super.setValue(container);
      super.hostConnected();
    } catch (error) {
      if (this.config) {
        this.destroyManagedContainer(container);
      } else {
        // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
        deprovisionContainer(container, this.lifecycle);
      }

      throw error;
    }
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
          deprovisionContainer(previous, this.lifecycle);
        }

        try {
          provisionContainer(container, this.lifecycle);

          super.setValue(container, force);
        } catch (error) {
          // Expect container to be deprovisioned by this moment, but leaving deprovision as explicit operation.
          deprovisionContainer(container, this.lifecycle);

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

      const container: Container = new Container(this.config, {
        skipMessaging: this.scope === ContainerProviderScope.Parent,
      });

      this.container = container;

      try {
        provisionContainer(container, this.lifecycle);

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
    deprovisionContainer(container, this.lifecycle);

    dbg.info(prefix(__filename), "Destroying managed container:", {
      container,
    });

    this.container = null;

    container.unbindAll();
  }
}
