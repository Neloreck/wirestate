import { Container, type Newable } from "inversify";

import { bindService } from "../bind/bind-service";

/**
 * Options for {@link mockBindService}.
 *
 * @group bind
 */
export interface MockBindServiceOptions {
  /**
   * Whether to skip the activation lifecycle for the service.
   * If true, `OnActivated` and `OnDeactivation` hooks will not be triggered.
   */
  skipLifecycle?: boolean;
}

/**
 * Binds a service class to the IoC container for testing purposes.
 * This utility uses {@link bindService} internally to ensure the service is correctly registered
 * with the appropriate scope and metadata.
 *
 * @group bind
 *
 * @param container - The IoC container to bind the service to.
 * @param ServiceClass - The service class to bind.
 * @param options - Optional binding configuration.
 * @returns Void.
 */
export function mockBindService<T extends object>(
  container: Container,
  ServiceClass: Newable<T>,
  options: MockBindServiceOptions = {}
): void {
  const { skipLifecycle } = options;

  return bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
