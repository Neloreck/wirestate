import { Newable } from "inversify";

import { mockBindService } from "@/wirestate/test-utils/mock-bind-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";

/**
 * Options for {@link mockService}.
 */
export interface IMockServiceOptions {
  /**
   * If true, skips the lifecycle hooks (e.g., OnActivated) during service binding and instantiation.
   */
  skipLifecycle?: boolean;
}

/**
 * Mocks a service by binding it to an IoC container and returning its instance.
 *
 * @param service - the service class to mock
 * @param container - the IoC container to use, defaults to a new {@link mockContainer}
 * @param options - additional options for mocking
 * @returns the instantiated service instance
 */
export function mockService<T extends object>(
  service: Newable<T>,
  container = mockContainer(),
  options: IMockServiceOptions = {}
): T {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
  });

  return container.get(service) as T;
}
