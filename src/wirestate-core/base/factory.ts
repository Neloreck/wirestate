import { Container } from "./container";
import { CircularDependencyError } from "./errors";
import { type Provider } from "./providers";
import * as Guards from "./providers";
import { getToken, toString } from "./tokens";
import { assertNever } from "./utils";

/**
 * Constructs values for providers, tracking the chain of providers under
 * construction to detect circular dependencies.
 *
 * @internal
 */
export class Factory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly underConstruction: Array<Provider<any>> = [];

  public constructor(private readonly container: Container) {}

  /**
   * Constructs values for a provider.
   *
   * @param provider - Provider to construct values for.
   * @returns Constructed values.
   */
  public construct<T>(provider: Provider<T>): Array<T> {
    try {
      if (this.underConstruction.includes(provider)) {
        const dependencyGraph = [...this.underConstruction, provider].map(getToken).map(toString);

        throw new CircularDependencyError(dependencyGraph);
      }

      this.underConstruction.push(provider);

      return this.doConstruct(provider);
    } finally {
      this.underConstruction.pop();
    }
  }

  private doConstruct<T>(provider: Provider<T>): Array<T> {
    if (Guards.isConstructorProvider(provider)) {
      return [new provider()];
    } else if (Guards.isClassProvider(provider)) {
      return [new provider.useClass()];
    } else if (Guards.isValueProvider(provider)) {
      return [provider.useValue];
    } else if (Guards.isFactoryProvider(provider)) {
      return [provider.useFactory(this.container)];
    } else if (Guards.isExistingProvider(provider)) {
      return this.container.get(provider.useExisting, { multi: true });
    }

    return assertNever(provider);
  }
}
