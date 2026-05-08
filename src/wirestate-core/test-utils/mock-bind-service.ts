import { Container, type Newable } from "inversify";

import { bindService } from "@/wirestate-core/bind/bind-service";

/**
 * Options for {@link mockBindService}.
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
 * @param container - the IoC container to bind the service to
 * @param ServiceClass - the service class to bind
 * @param options - optional binding configuration
 * @returns void
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
