import type { Container } from "./container";
import type { Token } from "./tokens";
import { type Class, isClassLike } from "./utils";

/**
 * A provider states how, for a given token, a service should be constructed.
 */
export type Provider<T> =
  | ConstructorProvider<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>
  | ExistingProvider<T>;

/**
 * Determines how constructed values are cached by the container:
 *
 * - `singleton` (default): the value is constructed once and reused for every resolution.
 * - `transient`: a new value is constructed for every resolution and never cached.
 */
export type ProviderScope = "singleton" | "transient";

/**
 * A handler invoked right after a provider constructs a value.
 * When a non-`undefined` value is returned, it replaces the constructed value.
 */
export type ProviderActivationHandler<T> = (instance: T, container: Container) => T | void;

/**
 * A handler invoked for each container-owned value right before its provider is unbound.
 */
export type ProviderDeactivationHandler<T> = (instance: T, container: Container) => void;

/**
 * A constructor provider refers to a class constructor,
 * which is the same class as the token itself.
 */
export type ConstructorProvider<T> = Class<T>;

/**
 * A class provider refers to a class constructor,
 * which may be the same class as the token, or a subclass.
 */
export interface ClassProvider<T> {
  provide: Token<T>;
  useClass: Class<NoInfer<T>>;
  multi?: true;
  scope?: ProviderScope;
  onActivated?: ProviderActivationHandler<NoInfer<T>>;
  onDeactivated?: ProviderDeactivationHandler<NoInfer<T>>;
}

/**
 * Provides a static value.
 */
export interface ValueProvider<T> {
  provide: Token<T>;
  useValue: T;
  multi?: true;
  onActivated?: ProviderActivationHandler<NoInfer<T>>;
  onDeactivated?: ProviderDeactivationHandler<NoInfer<T>>;
}

/**
 * Provides a value which is lazily returned by a factory function.
 */
export interface FactoryProvider<T> {
  provide: Token<T>;
  multi?: true;
  scope?: ProviderScope;
  useFactory: (container: Container) => NoInfer<T>;
  onActivated?: ProviderActivationHandler<NoInfer<T>>;
  onDeactivated?: ProviderDeactivationHandler<NoInfer<T>>;
}

/**
 * Provides a value that is provided by another provider.
 */
export interface ExistingProvider<T> {
  provide: Token<T>;
  useExisting: Token<T>;
  multi?: boolean;
}

/**
 * Type-guard to check if a provider is a constructor provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider is a bare class constructor.
 */
export function isConstructorProvider<T>(provider: Provider<T>): provider is ConstructorProvider<T> {
  return isClassLike(provider);
}

/**
 * Type-guard to check if a provider is a class provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider uses `useClass`.
 */
export function isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
  return "provide" in provider && "useClass" in provider;
}

/**
 * Type-guard to check if a provider is a value provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider uses `useValue`.
 */
export function isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
  return "provide" in provider && "useValue" in provider;
}

/**
 * Type-guard to check if a provider is a factory provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider uses `useFactory`.
 */
export function isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
  return "provide" in provider && "useFactory" in provider;
}

/**
 * Type-guard to check if a provider is an existing (alias) provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider uses `useExisting`.
 */
export function isExistingProvider<T>(provider: Provider<T>): provider is ExistingProvider<T> {
  return "provide" in provider && "useExisting" in provider;
}

/**
 * Checks if a provider is registered as a multi-provider.
 *
 * @param provider - Provider to check.
 * @returns Whether the provider contributes to a multi-token.
 */
export function isMultiProvider<T>(provider: Provider<T>): boolean {
  return "provide" in provider && "multi" in provider && provider.multi === true;
}

/**
 * Resolves the caching scope of a provider.
 * Constructor, value, and existing providers are always singletons.
 *
 * @param provider - Provider to inspect.
 * @returns The provider scope, `singleton` by default.
 */
export function getScope<T>(provider: Provider<T>): ProviderScope {
  if (isClassProvider(provider) || isFactoryProvider(provider)) {
    return provider.scope ?? "singleton";
  }

  return "singleton";
}

/**
 * Resolves lifecycle hooks of a provider.
 * Constructor and existing providers cannot carry hooks.
 *
 * @param provider - Provider to inspect.
 * @returns Activation/deactivation handlers declared by the provider, if any.
 */
export function getLifecycle<T>(provider: Provider<T>): {
  onActivated?: ProviderActivationHandler<T>;
  onDeactivated?: ProviderDeactivationHandler<T>;
} {
  if (isConstructorProvider(provider) || isExistingProvider(provider)) {
    return {};
  }

  return { onActivated: provider.onActivated, onDeactivated: provider.onDeactivated };
}
