import { Container } from "../alias";
import { CONTAINER_BINDINGS } from "../registry";
import { Maybe } from "../types/general";
import { Bindings } from "../types/provision";

/**
 * Records a binding as owned by a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container receiving the binding.
 * @param binding - Binding bound to the container.
 */
export function registerBinding(container: Container, binding: Bindings[number]): void {
  const bindings: Maybe<Array<Bindings[number]>> = CONTAINER_BINDINGS.get(container);

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
