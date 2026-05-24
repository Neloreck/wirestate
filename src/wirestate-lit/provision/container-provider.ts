import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import {
  Container,
  ContainerConfig,
  createContainer,
  deprovisionContainer,
  getContainerEntries,
  getEntryToken,
  provisionContainer,
  ServiceIdentifier,
  type ProvisionLifecycle,
  WirestateError,
} from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Represents options for the {@link ContainerProvider}.
 *
 * @remarks
 * Provide either an external `container` or managed creation `config`, but
 * never both at the same time.
 *
 * @group Provision
 */
export interface ContainerProviderOptions {
  /**
   * External container instance to provide as-is.
   *
   * @remarks
   * External containers are never activated, recreated, or disposed by this
   * provider. Provider lifecycle hooks run while the host is connected.
   */
  readonly container?: Container;

  /**
   * Managed container creation options.
   *
   * @remarks
   * The managed container is created during provider construction without
   * eager activation, activated when the host connects, disposed when it
   * disconnects, and recreated on the next reconnect.
   */
  readonly config?: ContainerConfig;
}

/**
 * Provider that exposes an IoC container context to the host element and its children.
 *
 * @remarks
 * The provider supports two modes:
 *
 * - External mode: `container` is an existing {@link Container}. The
 *   provider passes it through context, runs provider lifecycle hooks, and
 *   never disposes it.
 * - Managed mode: `config` is {@link ContainerConfig}. The provider
 *   creates a container during construction without eager activation,
 *   activates configured entries when the host connects, disposes the
 *   container when the host disconnects, runs provider lifecycle hooks while
 *   connected, and recreates it on reconnect.
 *
 * @group Provision
 */
export class ContainerProvider<E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected readonly lifecycle: ProvisionLifecycle = new Map();

  protected readonly config: Maybe<ContainerConfig>;

  protected destroyed: boolean = false;

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
    }

    const activate: ReadonlyArray<ServiceIdentifier> = options.config
      ? (options.config.activate === true ? options.config.entries?.map(getEntryToken) : options.config.activate) || []
      : [];

    if (options.config && activate.length) {
      if (!options.config.entries?.length) {
        throw new WirestateError(
          ERROR_CODE_INVALID_ARGUMENTS,
          "Supplied activation list while entries for binding are not provided."
        );
      }

      const entryTokens: ReadonlyArray<ServiceIdentifier> = options.config.entries.map(getEntryToken);

      for (const eager of activate) {
        if (!entryTokens.includes(eager)) {
          throw new WirestateError(
            ERROR_CODE_INVALID_ARGUMENTS,
            `createContainer: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
          );
        }
      }
    }

    super(host, {
      context: ContainerContext,
      initialValue: options.container ? options.container : createContainer({ ...options.config, activate: [] }),
    });

    this.config = options.config;

    dbg.info(prefix(__filename), "Constructed:", {
      host: this.host,
      source: options.container,
      container: this.value,
      options: this.config,
    });
  }

  public hostConnected(): void {
    if (this.config) {
      if (this.destroyed) {
        dbg.info(prefix(__filename), "Creating and activating managed container:", {
          container: this.value,
        });

        this.value = createContainer(this.config);
        this.destroyed = false;
      } else {
        const activate: ReadonlyArray<ServiceIdentifier> =
          (this.config.activate === true ? this.config.entries?.map(getEntryToken) : this.config.activate) || [];

        if (activate.length) {
          dbg.info(prefix(__filename), "Activating managed container:", {
            container: this.value,
          });

          for (const entry of activate) {
            this.value.get(entry);
          }
        }
      }
    }

    provisionContainer(this.value, this.lifecycle, getContainerEntries(this.value));

    super.hostConnected();
  }

  public hostDisconnected(): void {
    deprovisionContainer(this.value, this.lifecycle);

    if (this.config) {
      dbg.info(prefix(__filename), "Destroying managed container:", {
        container: this.value,
      });

      this.value.unbindAll();
      this.destroyed = true;
    }
  }
}
