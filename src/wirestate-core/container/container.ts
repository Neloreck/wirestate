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
import { CommandBus } from "../messaging/commands/command-bus";
import { EventBus } from "../messaging/events/event-bus";
import { QueryBus } from "../messaging/queries/query-bus";
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
}

/**
 * Describes options for {@link Container} construction.
 *
 * @group Container
 */
export interface ContainerOptions {
  /**
   * Skip binding container-scoped event, query, and command buses.
   *
   * @remarks
   * A child container can still inherit buses from its parent. Without bound or
   * inherited buses, resolving or injecting `EventBus`, `QueryBus`, and
   * `CommandBus` fails.
   *
   * @default `false`
   */
  readonly skipMessaging?: boolean;
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
   * @param options - Container creation options.
   */
  public constructor(config: ContainerConfig = {}, options: ContainerOptions = {}) {
    dbg.info(prefix(__filename), "Creating container:", { config, options });

    validateContainerConfig(config);

    super(config.parent);

    const errorHandler: Maybe<InternalErrorHandler> =
      config.onError ?? getConfiguredInternalErrorHandler(config.parent);

    if (errorHandler) {
      setInternalErrorHandler(this, errorHandler);
    }

    // Installed before any binding activates; the adapter resolves buses with
    // optional lookups, so it is installed even under `skipMessaging`.
    setActivationAdapter(this, wirestateActivationAdapter);

    this.bind({ token: Container, value: this });

    if (!options.skipMessaging) {
      this.bind({ token: EventBus, value: new EventBus(this) });
      this.bind({ token: QueryBus, value: new QueryBus() });
      this.bind({ token: CommandBus, value: new CommandBus() });
    }

    dbg.info(prefix(__filename), "Injecting bindings on creation:", { container: this, config, options });

    if (config.bindings) {
      for (const binding of config.bindings) {
        this.bind(binding);
      }
    }

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
   * @throws {@link WirestateError} If the container is already provisioned.
   */
  public provision(): void {
    provisionContainer(this);
  }

  /**
   * Deprovisions this container for a framework provider.
   *
   * @remarks
   * Runs `@OnDeprovision` in reverse provision order. Idempotent: deprovisioning
   * a container that is not currently provisioned is a no-op.
   */
  public deprovision(): void {
    deprovisionContainer(this);
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
