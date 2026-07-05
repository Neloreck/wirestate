import { setActivationAdapter } from "../activation/activation-adapter";
import { wirestateActivationAdapter } from "../activation/activation-lifecycle";
import {
  BindingScope,
  BindingType,
  type Binding,
  type BindingDescriptor,
  type InstanceBindingDescriptor,
  type ServiceToken,
} from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import {
  type InternalErrorHandler,
  getConfiguredInternalErrorHandler,
  setInternalErrorHandler,
} from "../error/internal-error-handler";
import { type WirestatePlugin } from "../plugin/plugin";
import { installOwnPlugins, setContainerPlugins } from "../plugin/plugin-registry";
import {
  assertBindableWhileProvisioned,
  deprovisionContainer,
  deprovisionContainerBinding,
  provisionContainer,
} from "../provision/provision-lifecycle";
import { type Maybe, type Newable } from "../types/general";

import { validateContainerConfig } from "./container-config-validation";
import { ContainerKernel } from "./container-kernel";
import { validateTransientInstanceBinding } from "./container-transient-binding-validation";

/**
 * Defines one {@link Container} scope at construction time.
 *
 * @remarks
 * Bind services and values here when they belong to the container from the
 * start. Use {@link validateContainerConfig} when a framework adapter stores
 * config before it creates the container.
 *
 * @group Container
 */
export interface ContainerConfig {
  /**
   * Controls which configured bindings are resolved during construction.
   *
   * @remarks
   * Pass `true` to resolve every entry in `bindings`. Pass an array to
   * resolve selected tokens from `bindings`. Omit it, or pass `false`, to keep
   * services lazy.
   */
  readonly activate?: boolean | ReadonlyArray<ServiceToken>;

  /**
   * Services or binding descriptors registered on this container.
   *
   * @remarks
   * Bare service classes bind as singleton instance bindings keyed by the
   * class itself. Descriptors can bind tokens to instances, factories, or
   * values.
   */
  readonly bindings?: ReadonlyArray<Binding>;

  /**
   * Parent container used for inherited bindings.
   *
   * @remarks
   * A child checks its own bindings first, then walks the parent chain. Local
   * bindings can replace parent bindings for the child scope.
   */
  readonly parent?: Container;

  /**
   * Handles isolated internal errors that Wirestate catches instead of
   * rethrowing, such as event handler failures and lifecycle rejections.
   *
   * @remarks
   * Child containers inherit the nearest parent handler when they do not
   * provide their own.
   */
  readonly onError?: InternalErrorHandler;

  /**
   * Plugins registered on this container.
   *
   * @remarks
   * Own plugins may install bindings, such as message buses, during
   * construction. Plugin lifecycle observers are effective for descendant
   * containers through the parent chain.
   */
  readonly plugins?: ReadonlyArray<WirestatePlugin>;
}

/**
 * Dependency injection container for one Wirestate scope.
 *
 * @remarks
 * A container owns its local bindings and the instances created from them.
 * It also owns provider lifecycle state and the plugin bindings installed on
 * that container. Child containers inherit parent bindings while keeping their
 * own local registrations and lifecycle state.
 *
 * @group Container
 *
 * @throws {@link WirestateError} If the config is invalid or `activate` names a token missing from `bindings`.
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
 *   bindings: [CounterService, LoggerService],
 * });
 *
 * const loggerService: LoggerService = container.get(LoggerService);
 * ```
 */
export class Container extends ContainerKernel {
  /**
   * Creates a Wirestate container.
   *
   * @param config - Container setup config.
   *
   * @throws {@link WirestateError} If the config is invalid.
   */
  public constructor(config: ContainerConfig = {}) {
    validateContainerConfig(config);

    super(config.parent);

    const errorHandler: Maybe<InternalErrorHandler> =
      config.onError ?? getConfiguredInternalErrorHandler(config.parent);

    if (errorHandler) {
      setInternalErrorHandler(this, errorHandler);
    }

    // Installed before any binding activates: the Wirestate instance lifecycle
    // (status, @OnActivation/@OnDeactivation) layered on the pure-DI kernel.
    setActivationAdapter(this, wirestateActivationAdapter);

    // Registered before any binding activates so the activation/provision dispatch can resolve them.
    if (config.plugins) {
      setContainerPlugins(this, config.plugins);
    }

    this.bind({ token: Container, value: this });

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
   * Binds a service class or a binding descriptor to this container.
   *
   * @remarks
   * A bare service class binds as a singleton instance binding keyed by the
   * class itself. Binding a descriptor lets you use an explicit token,
   * implementation class, factory, value, or transient scope.
   *
   * @param binding - Service class or binding descriptor to register.
   * @returns The same container for chaining.
   *
   * @throws {@link WirestateError} If the binding is invalid, or a transient instance
   * binding's class declares a lifecycle or messaging handler.
   */
  public override bind<T>(binding: Newable<object> | BindingDescriptor<T>): this {
    if (
      typeof binding !== "function" &&
      binding.type === BindingType.Instance &&
      (binding as InstanceBindingDescriptor<T>).scope === BindingScope.Transient
    ) {
      validateTransientInstanceBinding(binding as InstanceBindingDescriptor<T>);
    }

    assertBindableWhileProvisioned(this, binding as Binding);

    return super.bind(binding);
  }

  /**
   * Provisions this container for a framework provider.
   *
   * @remarks
   * Resolves provider lifecycle participants and runs `@OnProvision` once for
   * this provision cycle. A container is provisioned by at most one provider at a time.
   * Provisioning an already provisioned container throws. Deprovision it first.
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
   * Unbinds a local token and deactivates values created from it.
   *
   * @remarks
   * If the binding owns a provisioned provider lifecycle instance,
   * `@OnDeprovision` runs before `@OnDeactivation`.
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
   * Unbinds every local binding and deactivates this container's instances.
   *
   * @remarks
   * Provider lifecycle instances are deprovisioned before they deactivate.
   * Parent bindings and parent instances are not changed.
   *
   * @returns The same container for chaining.
   */
  public override unbindAll(): this {
    deprovisionContainer(this);

    return super.unbindAll();
  }
}
