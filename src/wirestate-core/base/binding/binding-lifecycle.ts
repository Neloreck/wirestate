import type { BindingActivationHandler, BindingDeactivationHandler, BindingDescriptor, BindingScope } from "./binding";
import { isDynamicValueDescriptor, isInstanceDescriptor, isServiceRedirectionDescriptor } from "./binding-guards";

/**
 * Resolves the caching scope of a binding descriptor.
 * Constant values and service redirections are always singletons.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns The binding scope, `Singleton` by default.
 */
export function getBindingScope<T>(binding: BindingDescriptor<T>): BindingScope {
  if (isInstanceDescriptor(binding) || isDynamicValueDescriptor(binding)) {
    return binding.scope ?? "Singleton";
  }

  return "Singleton";
}

/**
 * Resolves lifecycle hooks of a binding descriptor.
 * Service redirections cannot carry hooks.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns Activation/deactivation handlers declared by the descriptor, if any.
 */
export function getBindingLifecycle<T>(binding: BindingDescriptor<T>): {
  onActivated?: BindingActivationHandler<T>;
  onDeactivated?: BindingDeactivationHandler<T>;
} {
  if (isServiceRedirectionDescriptor(binding)) {
    return {};
  }

  return { onActivated: binding.onActivated, onDeactivated: binding.onDeactivated };
}
