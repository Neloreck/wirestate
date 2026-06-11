import type {
  BindingActivationHandler,
  BindingDeactivationHandler,
  BindingDescriptor,
  BindingScopeValue,
} from "./binding";
import { isFactoryDescriptor } from "./binding-guards";

/**
 * Resolves the caching scope of a binding descriptor.
 * Value and instance descriptors are always singletons.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns The binding scope, `Singleton` by default.
 */
export function getBindingScope<T>(binding: BindingDescriptor<T>): BindingScopeValue {
  if (isFactoryDescriptor(binding)) {
    return binding.scope ?? "Singleton";
  }

  return "Singleton";
}

/**
 * Resolves lifecycle hooks of a binding descriptor.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns Activation/deactivation handlers declared by the descriptor, if any.
 */
export function getBindingLifecycle<T>(binding: BindingDescriptor<T>): {
  onActivated?: BindingActivationHandler<T>;
  onDeactivated?: BindingDeactivationHandler<T>;
} {
  return { onActivated: binding.onActivated, onDeactivated: binding.onDeactivated };
}
