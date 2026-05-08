import { Container, Newable, ServiceIdentifier } from "inversify";

import { getEntryToken } from "../bind/get-entry-token";
import { createIocContainer } from "../container/create-ioc-container";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import type { InjectableDescriptor } from "../types/privision";

import { mockBindEntry } from "./mock-bind-entry";

/**
 * Options for {@link mockContainer}.
 */
export interface MockContainerOptions {
  /**
   * List of services or injectable descriptors to bind to the container.
   */
  entries?: Array<Newable<object> | InjectableDescriptor>;
  /**
   * List of injection identifiers to immediately activate after binding.
   * All identifiers must correspond to entries provided in the `services` list.
   */
  activate?: Array<ServiceIdentifier>;
  /**
   * Whether to skip the activation lifecycle for all bound services.
   * If true, `OnActivated` and `OnDeactivation` hooks will not be triggered.
   */
  skipLifecycle?: boolean;
}

/**
 * Creates and configures a mock IoC container for testing.
 * This utility initializes a new container and binds the provided services or descriptors using {@link mockBindEntry}.
 * It also supports optional immediate activation of services.
 *
 * @param options - configuration options for the mock container
 * @returns a configured InversifyJS {@link Container}
 *
 * @throws {WirestateError} if an identifier in `activate` is not found in `services`
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

  const container: Container = createIocContainer();

  for (const it of entries) {
    mockBindEntry(container, it, { skipLifecycle: skipLifecycle });
  }

  for (const it of activate) {
    container.get(it);
  }

  return container;
}
