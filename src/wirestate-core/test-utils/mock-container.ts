import { Container, ServiceIdentifier } from "../alias";
import { getEntryToken } from "../bind/get-entry-token";
import { createContainer, CreateContainerOptions } from "../container/create-container";
import { validateContainerConfig } from "../container/validate-container-config";

import { mockBindEntry } from "./mock-bind-entry";

/**
 * Represents options for {@link mockContainer}.
 *
 * @group Test-utils
 */
export interface MockContainerOptions extends CreateContainerOptions {
  /**
   * Whether to skip the activation lifecycle for all bound services.
   *
   * @remarks
   * If true, `@OnActivated` and `@OnDeactivation` hooks will not be triggered.
   *
   * @default false
   */
  readonly skipLifecycle?: boolean;
}

/**
 * Mocks and configures an Inversify {@link Container} for testing.
 *
 * @remarks
 * This utility initializes a new container via {@link createContainer} and
 * binds the provided `entries` using {@link mockBindEntry}. It can also
 * automatically resolve (activate) all or a subset of services.
 *
 * @group Test-utils
 *
 * @param options - Configuration options for the mock container.
 * @returns A configured Inversify {@link Container}.
 *
 * @throws {WirestateError} If an identifier in `activate` is not found in `entries`.
 *
 * @example
 * ```typescript
 * const container: Container = mockContainer({
 *   entries: [UserService, AuthService],
 *   activate: true
 * });
 * ```
 */
export function mockContainer(options: MockContainerOptions = {}): Container {
  const { entries = [], skipLifecycle } = options;

  validateContainerConfig(options);

  const activate: ReadonlyArray<ServiceIdentifier> =
    (options.activate === true ? entries.map(getEntryToken) : options.activate) || [];

  const container: Container = createContainer({ parent: options.parent, seeds: options.seeds, seed: options.seed });

  for (const it of entries) {
    mockBindEntry(container, it, { skipLifecycle: skipLifecycle });
  }

  for (const it of activate) {
    container.get(it);
  }

  return container;
}
