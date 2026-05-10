import { Container, type Newable } from "inversify";

/**
 * Unbinds a service from the IoC container.
 * This is useful in tests to reset or override specific service registrations.
 *
 * @group bind
 *
 * @param container - The IoC container to unbind the service from.
 * @param ServiceClass - The service class to unbind.
 */
export function mockUnbindService<T extends object>(container: Container, ServiceClass: Newable<T>): void {
  container.unbind(ServiceClass);
}
