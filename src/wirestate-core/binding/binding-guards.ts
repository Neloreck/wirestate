import type {
  BindingDescriptor,
  FactoryBindingDescriptor,
  InstanceBindingDescriptor,
  ValueBindingDescriptor,
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
 * @returns Whether the descriptor provides a value.
 */
export function isValueDescriptor<T>(binding: BindingDescriptor<T>): binding is ValueBindingDescriptor<T> {
  return "value" in binding && binding.type !== "Instance";
}

/**
 * Type-guard to check if a binding descriptor produces values through a factory.
 *
 * @param binding - Binding descriptor to check.
 * @returns Whether the descriptor uses a factory function.
 */
export function isFactoryDescriptor<T>(binding: BindingDescriptor<T>): binding is FactoryBindingDescriptor<T> {
  return "factory" in binding;
}
