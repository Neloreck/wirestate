import type { BindingDescriptor } from "../binding/binding";
import { isFactoryDescriptor, isInstanceDescriptor, isValueDescriptor } from "../binding/binding-guards";
import { toString } from "../binding/tokens";
import { CircularDependencyError } from "../error/circular-dependency-error";
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
   * Constructs the value for a binding descriptor.
   *
   * @param binding - Binding descriptor to construct the value for.
   * @returns Constructed value.
   *
   * @throws {@link CircularDependencyError} When the descriptor is already under construction.
   */
  public construct<T>(binding: BindingDescriptor<T>): T {
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

  private doConstruct<T>(binding: BindingDescriptor<T>): T {
    if (isInstanceDescriptor(binding)) {
      return new binding.value();
    } else if (isFactoryDescriptor(binding)) {
      return binding.factory(this.container);
    } else if (isValueDescriptor(binding)) {
      return binding.value;
    }

    return assertNever(binding);
  }
}
