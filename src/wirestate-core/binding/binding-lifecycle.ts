import { type BindingDescriptor, type BindingScopeValue, BindingType, type BindingTypeValue } from "./binding";
import { isFactoryDescriptor, isInstanceDescriptor } from "./binding-guards";

/**
 * Resolves the binding kind of a descriptor.
 * An explicit `type` wins. Otherwise a descriptor with a `factory` field is a
 * factory binding and anything else is a value binding.
 *
 * @param binding - Binding descriptor to inspect.
 * @returns The binding kind, inferred from the descriptor shape when not declared.
 */
export function getBindingType<T>(binding: BindingDescriptor<T>): BindingTypeValue {
  return binding.type ?? (isFactoryDescriptor(binding) ? BindingType.Factory : BindingType.Value);
}

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
