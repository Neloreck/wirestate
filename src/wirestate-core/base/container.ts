import { injectionContext } from "./context";
import { NoProviderFoundError } from "./errors";
import { Factory } from "./factory";
import * as Guards from "./providers";
import type { Provider } from "./providers";
import { type Token, isClassToken, toString, getToken } from "./tokens";
import { assertPresent, assertSingle, getParentClasses, windowedSlice } from "./utils";

/**
 * A dependency injection (DI) container will keep track of all bindings
 * and hold the actual instances of your services.
 *
 * All bindings are explicit: services are constructed synchronously and
 * only when a provider was registered with {@link Container.bind}.
 */
export class Container {
  /**
   * Parent container when this container was created as a child container.
   */
  public readonly parent?: Container;

  private readonly providers: ProviderMap = new Map();
  private readonly instances: InstanceMap = new Map();
  private readonly activated: Array<ActivationRecord> = [];
  private readonly factory: Factory;

  public constructor(parent?: Container) {
    this.parent = parent;
    this.factory = new Factory(this);
    this.bind({
      provide: Container,
      useValue: this,
    });
  }

  /**
   * Binds multiple providers to this container.
   *
   * {@link https://needle-di.io/concepts/binding.html#binding}.
   */
  public bindAll<A>(p1: Provider<A>): this;
  public bindAll<A, B>(p1: Provider<A>, p2: Provider<B>): this;
  public bindAll<A, B, C>(p1: Provider<A>, p2: Provider<B>, p3: Provider<C>): this;
  public bindAll<A, B, C, D>(p1: Provider<A>, p2: Provider<B>, p3: Provider<C>, p4: Provider<D>): this;
  public bindAll<A, B, C, D, E>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>
  ): this;
  public bindAll<A, B, C, D, E, F>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>
  ): this;
  // noinspection JSUnusedGlobalSymbols
  public bindAll<A, B, C, D, E, F, G>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>
  ): this;
  public bindAll<A, B, C, D, E, F, G, H>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>
  ): this;
  // noinspection JSUnusedGlobalSymbols
  public bindAll<A, B, C, D, E, F, G, H, I>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>,
    p9: Provider<I>
  ): this;
  public bindAll<A, B, C, D, E, F, G, H, I>(
    p1: Provider<A>,
    p2: Provider<B>,
    p3: Provider<C>,
    p4: Provider<D>,
    p5: Provider<E>,
    p6: Provider<F>,
    p7: Provider<G>,
    p8: Provider<H>,
    p9: Provider<I>,
    // eslint-disable-next-line
    ...providers: Provider<any>[]
  ): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public bindAll(...providers: Array<Provider<any>>): this {
    providers.forEach((it) => this.bind(it));

    return this;
  }

  /**
   * Binds a provider to this container.
   *
   * {@link https://needle-di.io/concepts/binding.html#binding}.
   *
   * @param provider
   */
  public bind<T>(provider: Provider<T>): this {
    const token = getToken(provider);

    // running some validations...
    if (Guards.isExistingProvider(provider) && provider.provide === provider.useExisting) {
      throw Error(`The provider for token ${toString(token)} with "useExisting" cannot refer to itself.`);
    }

    if (!Guards.isExistingProvider(provider) && this.hasConstructedProvider(token)) {
      throw Error(
        `Cannot bind a new provider for ${toString(token)}, since the existing provider was already constructed.`
      );
    }

    // ignore the new provider if it was already provided
    if (
      Guards.isExistingProvider(provider) &&
      Guards.isMultiProvider(provider) &&
      this.existingProviderAlreadyProvided(token, provider.useExisting)
    ) {
      return this;
    }

    const providers = this.providers.get(token) ?? [];

    // validating multi-provider inconsistencies...
    const multi = Guards.isMultiProvider(provider);

    if (multi && providers.some((it) => !Guards.isMultiProvider(it))) {
      throw Error(
        `Cannot bind ${toString(token)} as multi-provider, since there is already a provider which is not a multi-provider.`
      );
    } else if (!multi && providers.some((it) => Guards.isMultiProvider(it))) {
      if (!providers.every(Guards.isExistingProvider)) {
        throw Error(
          `Cannot bind ${toString(token)} as provider, since there are already provider(s) that are multi-providers.`
        );
      }
    }

    // appending or replacing providers...
    this.providers.set(token, multi ? [...providers, provider] : [provider]);

    // inheritance support: also bind parent classes to their immediate child classes
    if (isClassToken(token) && (Guards.isClassProvider(provider) || Guards.isConstructorProvider(provider))) {
      windowedSlice([token, ...getParentClasses(token)]).forEach(([childClass, parentClass]) => {
        const parentProvider: Provider<typeof childClass> = {
          provide: parentClass,
          useExisting: childClass,
          multi: true,
        };
        const existingParentProviders = this.providers.get(parentClass) ?? [];

        if (!this.existingProviderAlreadyProvided(parentClass, childClass)) {
          this.providers.set(parentClass, [...existingParentProviders, parentProvider]);
        }
      });
    }

    return this;
  }

  /**
   * Unbinds a provider, deactivating every container-owned value it constructed.
   *
   * {@link https://needle-di.io/concepts/binding.html#binding}.
   *
   * @param target - Token or provider to unbind.
   */
  public unbind<T>(target: Token<T> | Provider<T>): this {
    const token = resolveProviderToken(target);

    this.deactivate(token);

    this.providers.get(token)?.forEach((provider) => this.instances.delete(provider));
    this.providers.delete(token);

    return this;
  }

  /**
   * Unbinds all providers, deactivating container-owned values in reverse creation order,
   * so dependent services deactivate before their dependencies.
   *
   * {@link https://needle-di.io/concepts/binding.html#binding}.
   */
  public unbindAll(): this {
    for (let index = this.activated.length - 1; index >= 0; index--) {
      const { provider, instance } = this.activated[index];

      Guards.getLifecycle(provider).onDeactivated?.(instance, this);
    }

    this.activated.length = 0;
    this.providers.clear();
    this.instances.clear();

    return this;
  }

  /**
   * Retrieves a service from this container.
   *
   * {@link https://needle-di.io/concepts/containers.html}.
   */
  public get<T>(token: Token<T>): T;
  public get<T>(token: Token<T>, options: { multi: true }): Array<T>;
  public get<T>(token: Token<T>, options: { optional: true }): T | undefined;
  public get<T>(token: Token<T>, options: { multi: true; optional: true }): Array<T> | undefined;
  public get<T>(token: Token<T>, options: { lazy: true }): () => T;
  public get<T>(token: Token<T>, options: { lazy: true; multi: true }): () => Array<T>;
  public get<T>(token: Token<T>, options: { lazy: true; optional: true }): () => T | undefined;
  public get<T>(token: Token<T>, options: { lazy: true; multi: true; optional: true }): () => Array<T> | undefined;
  public get<T>(
    token: Token<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: false }
  ): T | Array<T> | undefined;
  public get<T>(
    token: Token<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: boolean }
  ): T | Array<T> | undefined | (() => T | Array<T> | undefined);
  public get<T>(
    token: Token<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: boolean }
  ): T | Array<T> | undefined | (() => T | Array<T> | undefined) {
    const lazy = options?.lazy ?? false;

    if (lazy) {
      return () => this.get(token, { ...options, lazy: false });
    }

    const optional = options?.optional ?? false;

    if (!this.providers.has(token)) {
      if (this.parent) {
        return this.parent.get(token, { ...options, lazy: false });
      }

      if (optional) {
        return undefined;
      }

      throw new NoProviderFoundError(token);
    }

    const providers = assertPresent(this.providers.get(token));
    const values = injectionContext(this).run(() =>
      providers.flatMap((provider) => this.resolveProvider(provider, token))
    );

    const multi = options?.multi ?? false;

    if (multi) {
      return values;
    } else {
      return assertSingle(values, () =>
        Error(
          `Requesting a single value for ${toString(token)}, but multiple values were provided. ` +
            `Consider passing "{ multi: true }" to inject all values, or adjust your bindings accordingly.`
        )
      );
    }
  }

  /**
   * Creates a child container.
   *
   * {@link https://needle-di.io/advanced/child-containers.html}.
   */
  public createChild(): Container {
    return new Container(this);
  }

  /**
   * Returns whether this container or one of its parents has one or more providers for this token.
   *
   * @param token
   */
  public has<T>(token: Token<T>): boolean {
    return this.providers.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Returns whether this container itself has one or more providers for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   */
  public hasOwn<T>(token: Token<T>): boolean {
    return this.providers.has(token);
  }

  /**
   * Resolves values for a single provider, applying scope caching and activation hooks.
   *
   * @param provider - Provider to resolve.
   * @param token - Token the provider was resolved for.
   */
  private resolveProvider<T>(provider: Provider<T>, token: Token<T>): Array<T> {
    // Aliases delegate to their target token and never own the produced values.
    if (Guards.isExistingProvider(provider)) {
      return this.factory.construct(provider);
    }

    if (Guards.getScope(provider) === "transient") {
      return this.factory.construct(provider).map((value) => this.activate(provider, value));
    }

    const constructed = this.instances.get(provider);

    if (constructed) {
      return constructed;
    }

    const values = this.factory.construct(provider).map((value) => this.activate(provider, value));

    this.commit(provider, token, values);

    return values;
  }

  /**
   * Runs the provider activation hook for a freshly constructed value.
   *
   * @param provider - Provider that constructed the value.
   * @param instance - Constructed value.
   * @returns The constructed value, or its replacement returned by the hook.
   */
  private activate<T>(provider: Provider<T>, instance: T): T {
    const handler = Guards.getLifecycle(provider).onActivated;

    if (!handler) {
      return instance;
    }

    const replaced = handler(instance, this) as T | undefined;

    return replaced === undefined ? instance : replaced;
  }

  /**
   * Caches singleton values of a provider and records them for later deactivation.
   *
   * @param provider - Provider that constructed the values.
   * @param token - Token the provider is bound under.
   * @param values - Constructed values.
   */
  private commit<T>(provider: Provider<T>, token: Token<T>, values: Array<T>): void {
    this.instances.set(provider, values);
    values.forEach((instance) => this.activated.push({ token, provider, instance }));
  }

  /**
   * Deactivates all container-owned values of a token in reverse creation order.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: Token<T>): void {
    for (let index = this.activated.length - 1; index >= 0; index--) {
      const record = this.activated[index];

      if (record.token === token) {
        Guards.getLifecycle(record.provider).onDeactivated?.(record.instance, this);
        this.activated.splice(index, 1);
      }
    }
  }

  /**
   * Checks whether any provider bound for the token has already constructed values.
   *
   * @param token - Token to check.
   */
  private hasConstructedProvider<T>(token: Token<T>): boolean {
    return (this.providers.get(token) ?? []).some((provider) => this.instances.has(provider));
  }

  private existingProviderAlreadyProvided(token: Token<unknown>, existingToken: Token<unknown>): boolean {
    return (this.providers.get(token) ?? []).some(
      (it) => Guards.isExistingProvider(it) && it.provide === token && it.useExisting === existingToken
    );
  }
}

interface ProviderMap extends Map<Token<unknown>, Array<Provider<unknown>>> {
  get<T>(key: Token<T>): Array<Provider<T>> | undefined;

  set<T>(key: Token<T>, value: Array<Provider<T>>): this;
}

/**
 * Lifecycle hook parameters make `Provider<T>` invariant in `T`,
 * so internal storage is keyed by an any-typed provider.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProvider = Provider<any>;

interface InstanceMap extends Map<AnyProvider, Array<unknown>> {
  get<T>(key: Provider<T>): Array<T> | undefined;

  set<T>(key: Provider<T>, value: Array<T>): this;
}

interface ActivationRecord {
  token: Token<unknown>;
  provider: AnyProvider;
  instance: unknown;
}

/**
 * Resolves the token to unbind from a token or provider argument.
 *
 * @param target - Token or provider.
 * @returns The token the provider is bound under, or the token itself.
 */
function resolveProviderToken<T>(target: Token<T> | Provider<T>): Token<T> {
  if (typeof target === "object" && target !== null && "provide" in target) {
    return getToken(target as Provider<T>);
  }

  return target as Token<T>;
}
