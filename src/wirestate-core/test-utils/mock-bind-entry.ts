import { Container, type Newable } from "inversify";

import { bindEntry } from "../bind/bind-entry";
import type { InjectableDescriptor } from "../types/privision";

/**
 * Represents options for {@link mockBindEntry}.
 *
 * @group Test-utils
 */
export interface MockBindEntryOptions {
  /**
   * Whether to skip the activation lifecycle for the entry.
   *
   * @remarks
   * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
   * This only applies when the entry is a service class or an instance binding.
   *
   * @default false
   */
  skipLifecycle?: boolean;
}

/**
 * Binds a service entry to the IoC container for testing purposes.
 *
 * @remarks
 * This utility is a testing wrapper for {@link bindEntry}.
 * It supports both service classes and {@link InjectableDescriptor} objects.
 *
 * @group Test-utils
 *
 * @template T - The type of the service being bound.
 *
 * @param container - The Inversify {@link Container} to bind the entry to.
 * @param entry - The service class constructor or {@link InjectableDescriptor} to bind.
 * @param options - Configuration options for the mock binding.
 *
 * @example
 * ```typescript
 * mockBindEntry(container, UserService, { skipLifecycle: true });
 * ```
 */
export function mockBindEntry<T extends object>(
  container: Container,
  entry: Newable<T> | InjectableDescriptor,
  options: MockBindEntryOptions = {}
): void {
  const { skipLifecycle } = options;

  bindEntry(container, entry, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
