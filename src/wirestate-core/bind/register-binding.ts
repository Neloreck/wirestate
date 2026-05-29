import { Container, ServiceIdentifier } from "../alias";
import { CONTAINER_BINDINGS } from "../registry";
import { Maybe } from "../types/general";
import { Binding, Bindings } from "../types/provision";

import { getBindingToken } from "./get-binding-token";

/**
 * Records a binding as owned by a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container receiving the binding.
 * @param binding - Binding bound to the container.
 */
export function registerBinding(container: Container, binding: Binding): void {
  const bindings: Maybe<Array<Binding>> = CONTAINER_BINDINGS.get(container);

  if (bindings) {
    bindings.push(binding);
  } else {
    CONTAINER_BINDINGS.set(container, [binding]);
  }
}

/**
 * Returns bindings Wirestate bound into a container.
 *
 * Framework providers use this list to run provider lifecycle hooks for
 * external containers. Raw Inversify bindings are invisible here.
 *
 * @group Container
 *
 * @param container - Container to inspect.
 * @returns Bindings registered through Wirestate binding helpers.
 *
 * @example
 * ```typescript
 * import { Injectable, createContainer, getContainerBindings } from "@wirestate/core";
 *
 * @Injectable()
 * class UserService {}
 *
 * const container = createContainer({ bindings: [UserService] });
 * const bindings = getContainerBindings(container);
 * ```
 */
export function getContainerBindings(container: Container): Bindings {
  return CONTAINER_BINDINGS.get(container) ?? [];
}

/**
 * Removes all Wirestate-owned binding entries for a token.
 *
 * @group Container
 * @internal
 *
 * @param container - Container losing the binding.
 * @param identifier - Binding token removed from the container.
 */
export function unregisterBinding(container: Container, identifier: ServiceIdentifier): void {
  const bindings: Maybe<Array<Binding>> = CONTAINER_BINDINGS.get(container);

  if (!bindings) {
    return;
  }

  const remaining: Array<Binding> = bindings.filter((binding) => !Object.is(getBindingToken(binding), identifier));

  if (remaining.length) {
    CONTAINER_BINDINGS.set(container, remaining);
  } else {
    CONTAINER_BINDINGS.delete(container);
  }
}

/**
 * Removes all Wirestate-owned binding entries for a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container losing all bindings.
 */
export function unregisterAllBindings(container: Container): void {
  CONTAINER_BINDINGS.delete(container);
}
