import { BindingType, Container, Newable, Identifier } from "../alias";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import {
  Binding,
  ValueBindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
} from "../types/provision";

import { bindFactory } from "./bind-factory";
import { bindInstance, bindInstanceWithToken } from "./bind-instance";
import { bindValue } from "./bind-value";

/**
 * Describes options for {@link bind}.
 *
 * @group Bind
 */
export interface BindOptions {
  /**
   * Skip `@OnActivated` and `@OnDeactivation` hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipActivationHooks?: boolean;
}

/**
 * Binds a {@link Binding} into a container.
 *
 * @remarks
 * `bind` is the router behind `createContainer({ bindings })`. Pass a
 * class constructor directly, or pass a descriptor when the binding needs a
 * custom token, static value, or factory.
 *
 * Descriptors without `type` are treated as `Value` bindings.
 *
 * - Class constructor: singleton instance binding.
 * - `Value`: static value binding.
 * - `Instance`: singleton instance behind a custom token.
 * - `Factory`: factory-backed value binding with optional scope.
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
 *   type: BindingType.Value,
 *   value: "https://api.example.com",
 * });
 * bind(container, {
 *   token: "DATE_NOW",
 *   type: BindingType.Factory,
 *   factory: () => new Date(),
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

  switch (binding.type ?? BindingType.Value) {
    case BindingType.Value:
      return bindValue(container, binding as ValueBindingDescriptor);

    case BindingType.Factory:
      return bindFactory(container, binding as FactoryBindingDescriptor);

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
