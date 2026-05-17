import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import { Container, createContainer, CreateContainerOptions, WirestateError } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/container-context";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Maybe } from "../types/general";

/**
 * Represents options for the {@link ContainerProviderController}.
 *
 * @remarks
 * Provide either an external `container` or managed creation `options`, but
 * never both at the same time.
 *
 * @group Provision
 */
export interface ContainerProviderControllerOptions {
  /**
   * External container instance to provide as-is.
   *
   * @remarks
   * External containers are never activated, recreated, or disposed by this
   * controller.
   */
  readonly container?: Container;

  /**
   * Managed container creation options.
   *
   * @remarks
   * The managed container is created during controller construction without
   * eager activation, activated when the host connects, disposed when it
   * disconnects, and recreated on the next reconnect.
   */
  readonly options?: CreateContainerOptions;
}

/**
 * Controller that provides an IoC container context to the host element and its children.
 *
 * @remarks
 * The controller supports two modes:
 *
 * - External mode: `container` is an existing {@link Container}. The
 *   controller passes it through context and does not alter its lifecycle.
 * - Managed mode: `options` is {@link CreateContainerOptions}. The controller
 *   creates a container during construction without eager activation,
 *   activates configured entries when the host connects, disposes the
 *   container when the host disconnects, and recreates it on reconnect.
 *
 * @group Provision
 */
export class ContainerProviderController<
  E extends ReactiveControllerHost & HTMLElement = ReactiveControllerHost & HTMLElement,
>
  extends ContextProvider<typeof ContainerContext, E>
  implements ReactiveController
{
  protected readonly options: Maybe<CreateContainerOptions>;

  protected destroyed: boolean = false;

  /**
   * @param host - The host element.
   * @param options - Provisioning options.
   * @param options.container - External container instance to provide.
   * @param options.options - Managed container creation options.
   */
  public constructor(host: E, options: ContainerProviderControllerOptions) {
    if (!options.container && !options.options) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProviderController requires a valid container instance or creation options."
      );
    } else if (options.container && options.options) {
      throw new WirestateError(
        ERROR_CODE_INVALID_ARGUMENTS,
        "ContainerProviderController requires only container or valid options object to be provided."
      );
    }

    super(host, {
      context: ContainerContext,
      initialValue: options.container ? options.container : createContainer({ ...options.options, activate: [] }),
    });

    this.options = options.options;

    dbg.info(prefix(__filename), "Constructed:", {
      host: this.host,
      source: options.container,
      container: this.value,
      options: this.options,
    });
  }

  public hostConnected(): void {
    if (this.options) {
      if (this.destroyed) {
        dbg.info(prefix(__filename), "Creating and activating managed container:", {
          container: this.value,
        });

        this.value = createContainer(this.options);
        this.destroyed = false;
      } else {
        if (this.options?.activate) {
          dbg.info(prefix(__filename), "Activating managed container:", {
            container: this.value,
          });

          for (const entry of this.options.activate) {
            this.value.get(entry);
          }
        }
      }
    }

    super.hostConnected();
  }

  public hostDisconnected(): void {
    if (this.options) {
      dbg.info(prefix(__filename), "Destroying managed container:", {
        container: this.value,
      });

      this.value.unbindAll();
      this.destroyed = true;
    }
  }
}
