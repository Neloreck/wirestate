import { Container, type ServiceIdentifier } from "../alias";

/**
 * Unbinds a token from the IoC container.
 *
 * @remarks
 * This is a convenience wrapper for `container.unbind`.
 * It is useful in tests to reset or override specific registrations
 * between test cases.
 *
 * @group Test-utils
 *
 * @template T - The type resolved by the token.
 *
 * @param container - The Inversify {@link Container} to unbind from.
 * @param identifier - The service identifier to unbind.
 *
 * @example
 * ```typescript
 * mockUnbind(container, LegacyService);
 * ```
 */
export function mockUnbind<T = unknown>(container: Container, identifier: ServiceIdentifier<T>): void {
  container.unbind(identifier);
}
