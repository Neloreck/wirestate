import * as Guards from "./bindings";
import { type Binding } from "./bindings";
import { Container } from "./container";
import { CircularDependencyError } from "./errors";
import { getBindingToken, toString } from "./tokens";
import { assertNever } from "./utils";

/**
 * Constructs values for bindings, tracking the chain of bindings under
 * construction to detect circular dependencies.
 *
 * @internal
 */
export class Factory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly underConstruction: Array<Binding<any>> = [];

  public constructor(private readonly container: Container) {}

  /**
   * Constructs values for a binding.
   *
   * @param binding - Binding to construct values for.
   * @returns Constructed values.
   */
  public construct<T>(binding: Binding<T>): Array<T> {
    try {
      if (this.underConstruction.includes(binding)) {
        const dependencyGraph = [...this.underConstruction, binding].map(getBindingToken).map(toString);

        throw new CircularDependencyError(dependencyGraph);
      }

      this.underConstruction.push(binding);

      return this.doConstruct(binding);
    } finally {
      this.underConstruction.pop();
    }
  }

  private doConstruct<T>(binding: Binding<T>): Array<T> {
    if (Guards.isConstructorBinding(binding)) {
      return [new binding()];
    } else if (Guards.isInstanceDescriptor(binding)) {
      return [new binding.value()];
    } else if (Guards.isDynamicValueDescriptor(binding)) {
      return [binding.factory(this.container)];
    } else if (Guards.isServiceRedirectionDescriptor(binding)) {
      return this.container.get(binding.service, { multi: true });
    } else if (Guards.isConstantValueDescriptor(binding)) {
      return [binding.value];
    }

    return assertNever(binding);
  }
}
