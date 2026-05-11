import { Container, type Newable } from "inversify";

import { bindService } from "../bind/bind-service";

/**
 * Represents options for {@link mockBindService}.
 *
 * @group Test-utils
 */
export interface MockBindServiceOptions {
  /**
   * Whether to skip the activation lifecycle for the service.
   *
   * @remarks
   * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
   *
   * @default false
   */
  skipLifecycle?: boolean;
}

/**
 * Binds a service class to the IoC container for testing purposes.
 *
 * @remarks
 * This utility is a testing wrapper for {@link bindService}.
 * It ensures the service is correctly registered with singleton scope and lifecycle metadata.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to bind the service to.
 * @param ServiceClass - The service class constructor to bind.
 * @param options - Configuration options for the mock binding.
 *
 * @example
 * ```typescript
 * mockBindService(container, AnalyticsService);
 * ```
 */
export function mockBindService<T extends object>(
  container: Container,
  ServiceClass: Newable<T>,
  options: MockBindServiceOptions = {}
): void {
  const { skipLifecycle } = options;

  bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
