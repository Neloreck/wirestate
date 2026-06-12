import type { BindingDescriptor, BindingScopeValue } from "./binding";
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
