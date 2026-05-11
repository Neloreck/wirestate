import { Container, type Newable } from "inversify";

/**
 * Unbinds a service from the IoC container.
 *
 * @remarks
 * This is a convenience wrapper for `container.unbind`.
 * It is useful in tests to reset or override specific service registrations
 * between test cases.
 *
 * @group Test-utils
 *
 * @template T - The type of the service to unbind.
 *
 * @param container - The Inversify {@link Container} to unbind from.
 * @param ServiceClass - The service class constructor to unbind.
 *
 * @example
 * ```typescript
 * mockUnbindService(container, LegacyService);
 * ```
 */
export function mockUnbindService<T extends object>(container: Container, ServiceClass: Newable<T>): void {
  container.unbind(ServiceClass);
}
