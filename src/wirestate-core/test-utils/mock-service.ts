import { Newable } from "inversify";

import { mockBindService } from "./mock-bind-service";
import { mockContainer } from "./mock-container";

/**
 * Options for {@link mockService}.
 *
 * @group test-utils
 */
export interface MockServiceOptions {
  /**
   * If true, skips lifecycle hooks (e.g., `@OnActivated`) during binding and instantiation.
   *
   * @default false
   */
  skipLifecycle?: boolean;
}

/**
 * Mocks a service by binding it to an IoC container and returning its resolved instance.
 *
 * @remarks
 * This is a high-level utility that combines {@link mockContainer} and {@link mockBindService}.
 * If no container is provided, a fresh one is created.
 *
 * @group test-utils
 *
 * @template T - The type of the service being mocked.
 *
 * @param service - The service class constructor to mock.
 * @param container - The Inversify {@link Container} to use (defaults to a new mock container).
 * @param options - Additional options for mocking.
 * @returns The resolved service instance.
 *
 * @example
 * ```typescript
 * const service: MyService = mockService(MyService);
 * ```
 */
export function mockService<T extends object>(
  service: Newable<T>,
  container = mockContainer(),
  options: MockServiceOptions = {}
): T {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
  });

  return container.get(service) as T;
}
