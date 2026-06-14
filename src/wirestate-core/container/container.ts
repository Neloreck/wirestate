import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { setActivationAdapter } from "../activation/activation-adapter";
import { wirestateActivationAdapter } from "../activation/activation-lifecycle";
import type { Bindings, ServiceToken } from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import {
  getConfiguredInternalErrorHandler,
  InternalErrorHandler,
  setInternalErrorHandler,
} from "../error/internal-error-handler";
import type { WirestatePlugin } from "../plugin/plugin";
import { installOwnPlugins, setContainerPlugins } from "../plugin/plugin-registry";
import {
  deprovisionContainer,
  deprovisionContainerBinding,
  provisionContainer,
} from "../provision/provision-lifecycle";
import { Maybe } from "../types/general";

import { validateContainerConfig } from "./container-config-validation";
import { ContainerKernel } from "./container-kernel";

/**
 * Describes reusable {@link Container} construction config.
 *
 * @group Container
 */
export interface ContainerConfig {
  /**
   * Bindings to resolve immediately.
   */
  readonly activate?: boolean | ReadonlyArray<ServiceToken>;

  /**
   * Services or binding descriptors to register.
   */
  readonly bindings?: Bindings;

  /**
   * Parent container for inherited bindings.
   */
  readonly parent?: Container;

  /**
   * Handles isolated internal errors that Wirestate catches instead of
   * rethrowing, such as event handler failures and lifecycle rejections.
   */
  readonly onError?: InternalErrorHandler;

  /**
   * Lifecycle plugins registered on this container.
   *
   * @remarks
   * Plugins observe or extend the container lifecycle and are inherited by
   * descendant containers. `install` runs once, here, at construction.
   */
  readonly plugins?: ReadonlyArray<WirestatePlugin>;
}

/**
 * A Wirestate-ready dependency injection container.
 *
 * @remarks
 * Extends the internal bare container kernel with the Wirestate composition.
 *
 * @group Container
 *
 * @throws {@link WirestateError} If `activate` names a token missing from `bindings`.
 *
 * @example
 * ```typescript
 * import { Container, Injectable } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container: Container = new Container({
 *   activate: [LoggerService],
 *   bindings: [CounterService, LoggerService],
 * });
 *
 * const logger = container.get(LoggerService);
 * ```
 */
export class Container extends ContainerKernel {
  /**
   * Creates a Wirestate container.
   *
   * @param config - Container setup config.
   */
  public constructor(config: ContainerConfig = {}) {
    dbg.info(prefix(__filename), "Creating container:", { config });

    validateContainerConfig(config);

    super(config.parent);

    const errorHandler: Maybe<InternalErrorHandler> =
      config.onError ?? getConfiguredInternalErrorHandler(config.parent);

    if (errorHandler) {
      setInternalErrorHandler(this, errorHandler);
    }

    // Installed before any binding activates: the Wirestate instance lifecycle
    // (status, @OnActivated/@OnDeactivation) layered on the pure-DI kernel.
    setActivationAdapter(this, wirestateActivationAdapter);

    // Registered before any binding activates so the activation/provision dispatch can resolve them.
    if (config.plugins) {
      setContainerPlugins(this, config.plugins);
    }

    this.bind({ token: Container, value: this });

    dbg.info(prefix(__filename), "Injecting bindings on creation:", { container: this, config });

    if (config.bindings) {
      for (const binding of config.bindings) {
        this.bind(binding);
      }
    }

    // Plugins contribute their bindings after user bindings are registered, before anything activates.
    installOwnPlugins(this);

    const activate: ReadonlyArray<ServiceToken> =
      (config.activate === true ? config.bindings?.map(getBindingToken) : config.activate) || [];

    for (const binding of activate) {
      this.get(binding);
    }
  }

  /**
   * Provisions this container for a framework provider.
   *
   * @remarks
   * Resolves provider lifecycle participants and runs `@OnProvision` once for
   * this provision cycle. A container is provisioned by at most one provider at
   * a time: provisioning an already provisioned container throws — deprovision
   * it first.
   *
   * @returns The same container for chaining.
   *
   * @throws {@link WirestateError} If the container is already provisioned.
   */
  public provision(): this {
    provisionContainer(this);

    return this;
  }

  /**
   * Deprovisions this container for a framework provider.
   *
   * @remarks
   * Runs `@OnDeprovision` in reverse provision order. Idempotent: deprovisioning
   * a container that is not currently provisioned is a no-op.
   *
   * @returns The same container for chaining.
   */
  public deprovision(): this {
    deprovisionContainer(this);

    return this;
  }

  /**
   * Unbinds a token, deprovisioning the owned provider lifecycle instance it
   * represents before the kernel deactivates it.
   *
   * @param token - Token to unbind.
   * @returns The same container for chaining.
   */
  public override unbind<T>(token: ServiceToken<T>): this {
    if (this.hasOwn(token)) {
      deprovisionContainerBinding(this, token);
    }

    return super.unbind(token);
  }

  /**
   * Unbinds all bindings, deprovisioning owned provider lifecycle instances
   * before the kernel deactivates them.
   *
   * @returns The same container for chaining.
   */
  public override unbindAll(): this {
    deprovisionContainer(this);

    return super.unbindAll();
  }
}
