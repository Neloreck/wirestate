import { Container, type Newable } from "inversify";

import { bindEntry } from "../bind/bind-entry";
import type { InjectableDescriptor } from "../types/privision";

/**
 * Options for {@link mockBindEntry}.
 */
export interface MockBindEntryOptions {
  /**
   * Whether to skip the activation lifecycle for the entry.
   * If true, `OnActivated` and `OnDeactivation` hooks will not be triggered.
   * Note: This only applies when the entry is a service class or an instance binding.
   */
  skipLifecycle?: boolean;
}

/**
 * Binds a service entry to the IoC container for testing purposes.
 * This utility uses {@link bindEntry} internally.
 * It supports both service classes and injectable descriptors (constants, dynamic values, etc.).
 *
 * @param container - the IoC container to bind the entry to
 * @param entry - the service class or injectable descriptor to bind
 * @param options - optional binding configuration
 * @returns void
 */
export function mockBindEntry<T extends object>(
  container: Container,
  entry: Newable<T> | InjectableDescriptor,
  options: MockBindEntryOptions = {}
): void {
  const { skipLifecycle } = options;

  return bindEntry(container, entry, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
