import { Container, type Newable } from "../alias";
import { bind } from "../bind/bind";
import { BindingDescriptor } from "../types/provision";

/**
 * Represents options for {@link mockBind}.
 *
 * @group Test-utils
 */
export interface MockBindOptions {
  /**
   * Whether to skip the activation lifecycle for the binding.
   *
   * @remarks
   * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
   * This only applies when the binding is a service class or an instance binding.
   *
   * @default false
   */
  skipLifecycle?: boolean;
}

/**
 * Binds a service class or descriptor to the IoC container for testing purposes.
 *
 * @remarks
 * This utility is a testing wrapper for {@link bind}.
 * It supports both service classes and {@link BindingDescriptor} objects.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to bind into.
 * @param binding - The service class constructor or {@link BindingDescriptor} to bind.
 * @param options - Configuration options for the mock binding.
 *
 * @example
 * ```typescript
 * mockBind(container, UserService, { skipLifecycle: true });
 * ```
 */
export function mockBind<T extends object>(
  container: Container,
  binding: Newable<T> | BindingDescriptor,
  options: MockBindOptions = {}
): void {
  const { skipLifecycle } = options;

  bind(container, binding, {
    skipLifecycle: skipLifecycle,
  });
}
