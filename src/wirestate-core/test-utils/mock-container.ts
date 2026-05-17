import { Container, Newable, ServiceIdentifier } from "inversify";

import { getEntryToken } from "../bind/get-entry-token";
import { createContainer } from "../container/create-container";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { AnyObject } from "../types/general";
import { SeedEntries } from "../types/initial-state";
import { InjectableDescriptor } from "../types/privision";

import { mockBindEntry } from "./mock-bind-entry";

/**
 * Represents options for {@link mockContainer}.
 *
 * @group Test-utils
 */
export interface MockContainerOptions {
  /**
   * Optional parent container.
   * Enables hierarchical resolution and sharing of bindings.
   */
  readonly parent?: Container;

  /**
   * Initial data for the root seed.
   */
  readonly seed?: AnyObject;

  /**
   * Targeted seeds bound to specific injectables or tokens.
   */
  readonly seeds?: SeedEntries;

  /**
   * List of services or injectable descriptors to bind to the container.
   *
   * @remarks
   * Accepts class constructors or {@link InjectableDescriptor} objects.
   */
  readonly entries?: Array<Newable<object> | InjectableDescriptor>;

  /**
   * List of injection identifiers to immediately activate after binding.
   *
   * @remarks
   * Activating a service triggers its resolution and `@OnActivated` hooks.
   * All identifiers must correspond to entries provided in the `entries` list.
   */
  readonly activate?: Array<ServiceIdentifier>;

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
 * automatically resolve (activate) a subset of services.
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
 *   activate: [AuthService]
 * });
 * ```
 */
export function mockContainer(options: MockContainerOptions = {}): Container {
  const { activate = [], entries = [], skipLifecycle } = options;

  if (activate.length) {
    const serviceTokens: Array<ServiceIdentifier> = entries.map((s) => getEntryToken(s));

    for (const token of activate) {
      if (!serviceTokens.includes(token)) {
        throw new WirestateError(
          ERROR_CODE_INVALID_ARGUMENTS,
          "Provided services for activation not matching list of services to bind."
        );
      }
    }
  }

  const container: Container = createContainer({ parent: options.parent, seeds: options.seeds, seed: options.seed });

  for (const it of entries) {
    mockBindEntry(container, it, { skipLifecycle: skipLifecycle });
  }

  for (const it of activate) {
    container.get(it);
  }

  return container;
}
