import type { Container } from "./container";
import type { Identifier } from "./tokens";
import { type Class, isClassLike } from "./utils";

/**
 * A binding states how, for a given token, a service should be constructed:
 * either a bare class constructor bound as its own token, or a binding descriptor.
 */
export type Binding<T> = ConstructorBinding<T> | BindingDescriptor<T>;

/**
 * A binding descriptor declares a token together with a construction strategy.
 */
export type BindingDescriptor<T> =
  | ConstantValueBindingDescriptor<T>
  | InstanceBindingDescriptor<T>
  | DynamicValueBindingDescriptor<T>
  | ServiceRedirectionBindingDescriptor<T>;

/**
 * Determines how constructed values are cached by the container:
 *
 * - `Singleton` (default): the value is constructed once and reused for every resolution.
 * - `Transient`: a new value is constructed for every resolution and never cached.
 */
export type BindingScope = "Singleton" | "Transient";

/**
 * A handler invoked right after a binding constructs a value.
 * When a non-`undefined` value is returned, it replaces the constructed value.
 */
export type BindingActivationHandler<T> = (instance: T, container: Container) => T | void;

/**
 * A handler invoked for each container-owned value right before its binding is unbound.
 */
export type BindingDeactivationHandler<T> = (instance: T, container: Container) => void;

/**
 * A constructor binding refers to a class constructor,
 * which is the same class as the token itself.
 */
export type ConstructorBinding<T> = Class<T>;

/**
 * Binds a static value to a token. Constant values are always singletons.
 */
export interface ConstantValueBindingDescriptor<T> {
  token: Identifier<T>;
  type?: "ConstantValue";
  value: T;
  multi?: true;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}

/**
 * Binds a class constructor behind a token,
 * which may be the same class as the token, or a subclass.
 */
export interface InstanceBindingDescriptor<T> {
  token: Identifier<T>;
  type: "Instance";
  value: Class<NoInfer<T>>;
  multi?: true;
  scope?: BindingScope;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}

/**
 * Binds a value which is lazily produced by a factory function.
 */
export interface DynamicValueBindingDescriptor<T> {
  token: Identifier<T>;
  type?: "DynamicValue";
  factory: (container: Container) => NoInfer<T>;
  multi?: true;
  scope?: BindingScope;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}

/**
 * Redirects a token to another service token.
 */
export interface ServiceRedirectionBindingDescriptor<T> {
  token: Identifier<T>;
  type?: "ServiceRedirection";
  service: Identifier<T>;
  multi?: boolean;
}

/**
 * Type-guard to check if a binding is a constructor binding.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding is a bare class constructor.
 */
export function isConstructorBinding<T>(binding: Binding<T>): binding is ConstructorBinding<T> {
  return isClassLike(binding);
}

/**
 * Type-guard to check if a binding is an instance binding descriptor.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding constructs a class behind a token.
 */
export function isInstanceDescriptor<T>(binding: Binding<T>): binding is InstanceBindingDescriptor<T> {
  return "token" in binding && "value" in binding && binding.type === "Instance";
}

/**
 * Type-guard to check if a binding is a constant value binding descriptor.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding provides a static value.
 */
export function isConstantValueDescriptor<T>(binding: Binding<T>): binding is ConstantValueBindingDescriptor<T> {
  return "token" in binding && "value" in binding && binding.type !== "Instance";
}

/**
 * Type-guard to check if a binding is a dynamic value binding descriptor.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding produces values through a factory.
 */
export function isDynamicValueDescriptor<T>(binding: Binding<T>): binding is DynamicValueBindingDescriptor<T> {
  return "token" in binding && "factory" in binding;
}

/**
 * Type-guard to check if a binding is a service redirection binding descriptor.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding redirects to another token.
 */
export function isServiceRedirectionDescriptor<T>(
  binding: Binding<T>
): binding is ServiceRedirectionBindingDescriptor<T> {
  return "token" in binding && "service" in binding;
}

/**
 * Checks if a binding is registered as a multi-binding.
 *
 * @param binding - Binding to check.
 * @returns Whether the binding contributes to a multi-token.
 */
export function isMultiBinding<T>(binding: Binding<T>): boolean {
  return "token" in binding && "multi" in binding && binding.multi === true;
}

/**
 * Resolves the caching scope of a binding.
 * Constructor, constant value, and service redirection bindings are always singletons.
 *
 * @param binding - Binding to inspect.
 * @returns The binding scope, `Singleton` by default.
 */
export function getScope<T>(binding: Binding<T>): BindingScope {
  if (isInstanceDescriptor(binding) || isDynamicValueDescriptor(binding)) {
    return binding.scope ?? "Singleton";
  }

  return "Singleton";
}

/**
 * Resolves lifecycle hooks of a binding.
 * Constructor bindings and service redirections cannot carry hooks.
 *
 * @param binding - Binding to inspect.
 * @returns Activation/deactivation handlers declared by the binding, if any.
 */
export function getLifecycle<T>(binding: Binding<T>): {
  onActivated?: BindingActivationHandler<T>;
  onDeactivated?: BindingDeactivationHandler<T>;
} {
  if (isConstructorBinding(binding) || isServiceRedirectionDescriptor(binding)) {
    return {};
  }

  return { onActivated: binding.onActivated, onDeactivated: binding.onDeactivated };
}
