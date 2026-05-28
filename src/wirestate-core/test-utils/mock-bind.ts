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
 * Binds a service class or descriptor to a test container.
 *
 * @remarks
 * This is a testing wrapper for {@link bind}. It accepts the same binding
 * shapes as `mockContainer({ bindings })`: service classes and
 * {@link BindingDescriptor} objects.
 *
 * The provided container is mutated and returned, which allows compact test
 * setup when adding bindings to an existing container.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to update.
 * @param binding - The service class constructor or {@link BindingDescriptor} to bind.
 * @param options - Configuration options for the mock binding.
 * @returns The same {@link Container} instance after the binding is added.
 *
 * @example
 * ```typescript
 * const container = mockContainer();
 *
 * mockBind(container, UserService, { skipLifecycle: true });
 * mockBind(container, { id: ApiClient, value: fakeApiClient });
 * ```
 */
export function mockBind<T extends object>(
  container: Container,
  binding: Newable<T> | BindingDescriptor,
  options: MockBindOptions = {}
): Container {
  const { skipLifecycle } = options;

  bind(container, binding, {
    skipLifecycle: skipLifecycle,
  });

  return container;
}
