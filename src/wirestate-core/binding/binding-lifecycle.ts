import { type Binding, type BindingScopeValue, BindingType, type BindingTypeValue } from "./binding";
import { isFactoryDescriptor, isInstanceDescriptor } from "./binding-guards";

/**
 * Resolves the binding kind of a binding.
 *
 * @remarks
 * A bare service class binds as an instance binding. For a descriptor, an explicit `type`
 * wins, a `factory` field means a factory binding, and anything else is a value binding.
 * Use it instead of reading `type` directly, which is optional for value and factory
 * descriptors and absent on a bare class.
 *
 * @group Bind
 *
 * @param binding - Service class or descriptor to inspect.
 * @returns The binding kind, inferred from the binding shape when not declared.
 *
 * @example
 * ```typescript
 * import { getBindingType, Injectable } from "@wirestate/core";
 *
 * @Injectable()
 * class UserService {}
 *
 * getBindingType(UserService); // "Instance"
 * getBindingType({ token: "API_URL", value: "https://api.example.com" }); // "Value"
 * getBindingType({ token: "API_CLIENT", factory: () => createClient() }); // "Factory"
 * ```
 */
export function getBindingType(binding: Binding): BindingTypeValue {
  if (typeof binding === "function") {
    return BindingType.Instance;
  }

  return binding.type ?? (isFactoryDescriptor(binding) ? BindingType.Factory : BindingType.Value);
}

/**
 * Resolves the caching scope of a binding.
 *
 * @remarks
 * A bare service class binds as a singleton, and value descriptors are always singletons.
 * Factory and instance descriptors may declare a `Transient` scope and otherwise default
 * to `Singleton`. Use it instead of reading `scope` directly, which is optional and absent
 * on both value descriptors and a bare class.
 *
 * @group Bind
 *
 * @param binding - Service class or descriptor to inspect.
 * @returns The binding scope, `Singleton` by default.
 *
 * @example
 * ```typescript
 * import { BindingScope, BindingType, getBindingScope, Injectable } from "@wirestate/core";
 *
 * @Injectable()
 * class UserService {}
 *
 * getBindingScope(UserService); // "Singleton"
 * getBindingScope({
 *   token: "REQUEST_ID",
 *   type: BindingType.Factory,
 *   scope: BindingScope.Transient,
 *   factory: () => crypto.randomUUID(),
 * }); // "Transient"
 * ```
 */
export function getBindingScope(binding: Binding): BindingScopeValue {
  if (typeof binding !== "function" && (isFactoryDescriptor(binding) || isInstanceDescriptor(binding))) {
    return binding.scope ?? "Singleton";
  }

  return "Singleton";
}
