import { BindingType, Container, Newable, Identifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import {
  Binding,
  ConstantValueBindingDescriptor,
  DynamicValueBindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ResolvedValueBindingDescriptor,
  ServiceRedirectionBindingDescriptor,
} from "../types/provision";

import { bindConstant } from "./bind-constant";
import { bindDynamicValue } from "./bind-dynamic-value";
import { bindFactory } from "./bind-factory";
import { bindInstance, bindInstanceWithToken, type BindInstanceOptions } from "./bind-instance";
import { bindResolvedValue } from "./bind-resolved-value";
import { bindServiceRedirection } from "./bind-service-redirection";

/**
 * Describes options for {@link bind}.
 *
 * @group Bind
 */
export interface BindOptions extends BindInstanceOptions {
  /**
   * Skip lifecycle hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipLifecycle?: boolean;
}

/**
 * Binds a {@link Binding} into a container.
 *
 * @remarks
 * `bind` is the router behind `createContainer({ bindings })`. Pass a
 * class constructor directly, or pass a descriptor when the binding needs a
 * custom token, constant value, factory, resolved value, or token redirection.
 *
 * Descriptors without `type` are treated as `ConstantValue` bindings.
 * Descriptors with `Factory`, `ResolvedValue`, and `ServiceRedirection` are
 * delegated to their dedicated Inversify binding helpers.
 *
 * - Class constructor: singleton instance binding.
 * - `ConstantValue`: constant value binding.
 * - `DynamicValue`: factory value binding.
 * - `Instance`: singleton instance behind a custom token.
 * - `Factory`: factory creator binding.
 * - `ResolvedValue`: injected factory binding.
 * - `ServiceRedirection`: token redirection binding.
 *
 * @group Bind
 *
 * @template T - Bound object type.
 *
 * @param container - Container to bind into.
 * @param binding - Service class or binding descriptor.
 * @param options - Binding options for class bindings.
 * @returns The same container for chaining or immediate resolution.
 *
 * @throws {@link WirestateError} If the descriptor has no `token`, has an unknown
 * `type` or `scope`, or is missing fields required by the
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
 *   token: API_URL,
 *   type: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * });
 * bind(container, {
 *   token: "USER_SERVICE_FACTORY",
 *   type: BindingType.Factory,
 *   factory: () => () => container.get(UserService),
 * });
 * ```
 */
export function bind<T extends object = object>(
  container: Container,
  binding: Binding,
  options: BindOptions = {}
): Container {
  if (typeof binding === "function") {
    return bindInstance(container, binding, options);
  }

  switch (binding.type ?? BindingType.ConstantValue) {
    case BindingType.ConstantValue:
      return bindConstant(container, binding as ConstantValueBindingDescriptor);

    case BindingType.DynamicValue:
      return bindDynamicValue(container, binding as DynamicValueBindingDescriptor);

    case BindingType.Factory:
      return bindFactory(container, binding as FactoryBindingDescriptor);

    case BindingType.ResolvedValue:
      return bindResolvedValue(container, binding as ResolvedValueBindingDescriptor);

    case BindingType.ServiceRedirection:
      return bindServiceRedirection(container, binding as ServiceRedirectionBindingDescriptor);

    case BindingType.Instance:
      return bindInstanceWithToken(
        container,
        binding.token as Identifier<T>,
        (binding as InstanceBindingDescriptor<T>).value as unknown as Newable<T>,
        binding as InstanceBindingDescriptor<T>,
        options
      );

    default:
      throw new WirestateError(
        `Binding descriptor has unknown type '${String(binding.type)}'.`,
        ERROR_CODE_INVALID_ARGUMENTS
      );
  }
}
