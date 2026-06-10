import type { BindingDescriptor } from "../binding/binding";
import {
  isConstantValueDescriptor,
  isDynamicValueDescriptor,
  isInstanceDescriptor,
  isServiceRedirectionDescriptor,
} from "../binding/binding-guards";
import { CircularDependencyError } from "../errors";
import { toString } from "../tokens";
import { assertNever } from "../utils/asserts";

import type { Container } from "./container";

/**
 * Constructs values for binding descriptors, tracking the chain of descriptors
 * under construction to detect circular dependencies.
 *
 * @internal
 */
export class Factory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly underConstruction: Array<BindingDescriptor<any>> = [];

  public constructor(private readonly container: Container) {}

  /**
   * Constructs values for a binding descriptor.
   *
   * @param binding - Binding descriptor to construct values for.
   * @returns Constructed values.
   *
   * @throws {@link CircularDependencyError} When the descriptor is already under construction.
   */
  public construct<T>(binding: BindingDescriptor<T>): Array<T> {
    try {
      if (this.underConstruction.includes(binding)) {
        const dependencyGraph = [...this.underConstruction, binding].map((it) => toString(it.token));

        throw new CircularDependencyError(dependencyGraph);
      }

      this.underConstruction.push(binding);

      return this.doConstruct(binding);
    } finally {
      this.underConstruction.pop();
    }
  }

  private doConstruct<T>(binding: BindingDescriptor<T>): Array<T> {
    if (isInstanceDescriptor(binding)) {
      return [new binding.value()];
    } else if (isDynamicValueDescriptor(binding)) {
      return [binding.factory(this.container)];
    } else if (isServiceRedirectionDescriptor(binding)) {
      return this.container.get(binding.service, { multi: true });
    } else if (isConstantValueDescriptor(binding)) {
      return [binding.value];
    }

    return assertNever(binding);
  }
}
