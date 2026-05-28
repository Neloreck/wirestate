import { BindingType, Container, Newable, ServiceIdentifier } from "../alias";
import { Binding } from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindDynamicValue } from "./bind-dynamic-value";
import { bindFactory } from "./bind-factory";
import { bindResolvedValue } from "./bind-resolved-value";
import { bindService, bindServiceWithToken, type BindServiceOptions } from "./bind-service";
import { bindServiceRedirection } from "./bind-service-redirection";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

/**
 * Represents options for {@link bind}.
 *
 * @group Bind
 */
export interface BindOptions extends BindServiceOptions {
  /**
   * Skip service lifecycle hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipLifecycle?: boolean;
}

/**
 * Binds a {@link Binding} into a container.
 *
 * @remarks
 * `bind` is the router behind `createContainer({ bindings })`. Pass a service
 * class constructor directly, or pass a descriptor when the binding needs a
 * custom token, fixed value, factory, resolved value, or token redirection.
 *
 * Descriptors without `bindingType` are treated as `ConstantValue` bindings.
 * Descriptors with `Factory`, `ResolvedValue`, and `ServiceRedirection` are
 * delegated to their dedicated Inversify binding helpers.
 *
 * - Class constructor: singleton service via {@link bindService}.
 * - `ConstantValue`: fixed value via {@link bindConstant}.
 * - `DynamicValue`: factory value via {@link bindDynamicValue}.
 * - `Instance`: service class behind a custom token.
 * - `Factory`: factory creator via {@link bindFactory}.
 * - `ResolvedValue`: injected factory via {@link bindResolvedValue}.
 * - `ServiceRedirection`: token redirection via {@link bindServiceRedirection}.
 *
 * @group Bind
 *
 * @template T - Bound object type.
 *
 * @param container - Container to bind into.
 * @param binding - Service class or binding descriptor.
 * @param options - Binding options for class bindings.
 *
 * @throws {@link WirestateError} If the descriptor has no `id`, has an unknown
 * `bindingType` or `scopeBindingType`, or is missing fields required by the
 * selected binding strategy.
 *
 * @example
 * ```typescript
 * import { BindingType, Injectable, bind, createContainer } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * @Injectable()
 * class UserService {}
 *
 * const container = createContainer();
 *
 * bind(container, UserService);
 * bind(container, {
 *   id: API_URL,
 *   bindingType: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * });
 * bind(container, {
 *   id: "USER_SERVICE_FACTORY",
 *   bindingType: BindingType.Factory,
 *   factory: () => () => container.get(UserService),
 * });
 * ```
 */
export function bind<T extends object = object>(
  container: Container,
  binding: Binding,
  options: BindOptions = {}
): void {
  if (typeof binding === "function") {
    bindService(container, binding, options);

    return;
  }

  validateBindingDescriptor(binding);

  switch (binding.bindingType ?? BindingType.ConstantValue) {
    case BindingType.ConstantValue:
      bindConstant(container, binding);

      return;

    case BindingType.DynamicValue:
      bindDynamicValue(container, binding);

      return;

    case BindingType.Factory:
      bindFactory(container, binding);

      return;

    case BindingType.ResolvedValue:
      bindResolvedValue(container, binding);

      return;

    case BindingType.ServiceRedirection:
      bindServiceRedirection(container, binding);

      return;

    case BindingType.Instance:
      bindServiceWithToken(
        container,
        binding.id as ServiceIdentifier<T>,
        binding.value as unknown as Newable<T>,
        binding,
        options
      );

      return;
  }
}
