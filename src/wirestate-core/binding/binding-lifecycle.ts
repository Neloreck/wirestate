import { type BindingDescriptor, type BindingScopeValue } from "./binding";
import { isFactoryDescriptor, isInstanceDescriptor } from "./binding-guards";

/**
 * Resolves the caching scope of a binding descriptor.
 * Value descriptors are always singletons. Factory and instance descriptors
 * may declare a `Transient` scope and otherwise default to `Singleton`.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns The binding scope, `Singleton` by default.
 */
export function getBindingScope<T>(binding: BindingDescriptor<T>): BindingScopeValue {
  if (isFactoryDescriptor(binding) || isInstanceDescriptor(binding)) {
    return binding.scope ?? "Singleton";
  }

  return "Singleton";
}
