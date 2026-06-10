import type {
  BindingDescriptor,
  ConstantValueBindingDescriptor,
  DynamicValueBindingDescriptor,
  InstanceBindingDescriptor,
  ServiceRedirectionBindingDescriptor,
} from "./binding";

/**
 * Type-guard to check if a binding descriptor binds a class behind a token.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor constructs a class instance.
 */
export function isInstanceDescriptor<T>(binding: BindingDescriptor<T>): binding is InstanceBindingDescriptor<T> {
  return "value" in binding && binding.type === "Instance";
}

/**
 * Type-guard to check if a binding descriptor provides a static value.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor provides a constant value.
 */
export function isConstantValueDescriptor<T>(
  binding: BindingDescriptor<T>
): binding is ConstantValueBindingDescriptor<T> {
  return "value" in binding && binding.type !== "Instance";
}

/**
 * Type-guard to check if a binding descriptor produces values through a factory.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor uses a factory function.
 */
export function isDynamicValueDescriptor<T>(
  binding: BindingDescriptor<T>
): binding is DynamicValueBindingDescriptor<T> {
  return "factory" in binding;
}

/**
 * Type-guard to check if a binding descriptor redirects to another token.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor is a service redirection.
 */
export function isServiceRedirectionDescriptor<T>(
  binding: BindingDescriptor<T>
): binding is ServiceRedirectionBindingDescriptor<T> {
  return "service" in binding;
}

/**
 * Checks if a binding descriptor is registered as a multi-binding.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor contributes to a multi-token.
 */
export function isMultiBinding<T>(binding: BindingDescriptor<T>): boolean {
  return binding.multi === true;
}
