import * as Guards from "./bindings";
import type { Binding } from "./bindings";
import { injectionContext } from "./context";
import { NoBindingFoundError } from "./errors";
import { Factory } from "./factory";
import { type Identifier, isClassToken, toString, getBindingToken } from "./tokens";
import { assertPresent, assertSingle, getParentClasses, windowedSlice } from "./utils";

/**
 * A dependency injection (DI) container will keep track of all bindings
 * and hold the actual instances of your services.
 *
 * All bindings are explicit: services are constructed synchronously and
 * only when a binding was registered with {@link Container.bind}.
 */
export class Container {
  /**
   * Parent container when this container was created as a child container.
   */
  public readonly parent?: Container;

  private readonly bindings: BindingMap = new Map();
  private readonly instances: InstanceMap = new Map();
  private readonly activated: Array<ActivationRecord> = [];
  private readonly factory: Factory;

  public constructor(parent?: Container) {
    this.parent = parent;
    this.factory = new Factory(this);

    this.bind({
      token: Container,
      value: this,
    });
  }

  /**
   * Binds multiple bindings to this container.
   */
  public bindAll<A>(b1: Binding<A>): this;
  public bindAll<A, B>(b1: Binding<A>, b2: Binding<B>): this;
  public bindAll<A, B, C>(b1: Binding<A>, b2: Binding<B>, b3: Binding<C>): this;
  public bindAll<A, B, C, D>(b1: Binding<A>, b2: Binding<B>, b3: Binding<C>, b4: Binding<D>): this;
  public bindAll<A, B, C, D, E>(b1: Binding<A>, b2: Binding<B>, b3: Binding<C>, b4: Binding<D>, b5: Binding<E>): this;
  public bindAll<A, B, C, D, E, F>(
    b1: Binding<A>,
    b2: Binding<B>,
    b3: Binding<C>,
    b4: Binding<D>,
    b5: Binding<E>,
    b6: Binding<F>
  ): this;
  // noinspection JSUnusedGlobalSymbols
  public bindAll<A, B, C, D, E, F, G>(
    b1: Binding<A>,
    b2: Binding<B>,
    b3: Binding<C>,
    b4: Binding<D>,
    b5: Binding<E>,
    b6: Binding<F>,
    b7: Binding<G>
  ): this;
  public bindAll<A, B, C, D, E, F, G, H>(
    b1: Binding<A>,
    b2: Binding<B>,
    b3: Binding<C>,
    b4: Binding<D>,
    b5: Binding<E>,
    b6: Binding<F>,
    b7: Binding<G>,
    b8: Binding<H>
  ): this;
  // noinspection JSUnusedGlobalSymbols
  public bindAll<A, B, C, D, E, F, G, H, I>(
    b1: Binding<A>,
    b2: Binding<B>,
    b3: Binding<C>,
    b4: Binding<D>,
    b5: Binding<E>,
    b6: Binding<F>,
    b7: Binding<G>,
    b8: Binding<H>,
    b9: Binding<I>
  ): this;
  public bindAll<A, B, C, D, E, F, G, H, I>(
    b1: Binding<A>,
    b2: Binding<B>,
    b3: Binding<C>,
    b4: Binding<D>,
    b5: Binding<E>,
    b6: Binding<F>,
    b7: Binding<G>,
    b8: Binding<H>,
    b9: Binding<I>,
    // eslint-disable-next-line
    ...bindings: Binding<any>[]
  ): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public bindAll(...bindings: Array<Binding<any>>): this {
    bindings.forEach((it) => this.bind(it));

    return this;
  }

  /**
   * Binds a class or binding descriptor to this container.
   *
   * @param binding
   */
  public bind<T>(binding: Binding<T>): this {
    const token = getBindingToken(binding);

    // running some validations...
    if (Guards.isServiceRedirectionDescriptor(binding) && binding.token === binding.service) {
      throw Error(`The service redirection for token ${toString(token)} cannot refer to itself.`);
    }

    if (!Guards.isServiceRedirectionDescriptor(binding) && this.hasConstructedBinding(token)) {
      throw Error(
        `Cannot bind a new binding for ${toString(token)}, since the existing binding was already constructed.`
      );
    }

    // ignore the new binding if it was already registered
    if (
      Guards.isServiceRedirectionDescriptor(binding) &&
      Guards.isMultiBinding(binding) &&
      this.serviceRedirectionAlreadyBound(token, binding.service)
    ) {
      return this;
    }

    const bindings = this.bindings.get(token) ?? [];

    // validating multi-binding inconsistencies...
    const multi = Guards.isMultiBinding(binding);

    if (multi && bindings.some((it) => !Guards.isMultiBinding(it))) {
      throw Error(
        `Cannot bind ${toString(token)} as multi-binding, since there is already a binding which is not a multi-binding.`
      );
    } else if (!multi && bindings.some((it) => Guards.isMultiBinding(it))) {
      if (!bindings.every(Guards.isServiceRedirectionDescriptor)) {
        throw Error(
          `Cannot bind ${toString(token)} as binding, since there are already binding(s) that are multi-bindings.`
        );
      }
    }

    // appending or replacing bindings...
    this.bindings.set(token, multi ? [...bindings, binding] : [binding]);

    // inheritance support: also bind parent classes to their immediate child classes
    if (isClassToken(token) && (Guards.isInstanceDescriptor(binding) || Guards.isConstructorBinding(binding))) {
      windowedSlice([token, ...getParentClasses(token)]).forEach(([childClass, parentClass]) => {
        const parentBinding: Binding<typeof childClass> = {
          token: parentClass,
          service: childClass,
          multi: true,
        };
        const existingParentBindings = this.bindings.get(parentClass) ?? [];

        if (!this.serviceRedirectionAlreadyBound(parentClass, childClass)) {
          this.bindings.set(parentClass, [...existingParentBindings, parentBinding]);
        }
      });
    }

    return this;
  }

  /**
   * Unbinds a token, deactivating every container-owned value it constructed.
   *
   * @param target - Token or binding to unbind.
   */
  public unbind<T>(target: Identifier<T> | Binding<T>): this {
    const token = resolveBindingToken(target);

    this.deactivate(token);

    this.bindings.get(token)?.forEach((binding) => this.instances.delete(binding));
    this.bindings.delete(token);

    return this;
  }

  /**
   * Unbinds all bindings, deactivating container-owned values in creation order.
   * Bindings stay resolvable until every deactivation handler has run, so
   * deactivating services can still talk to each other.
   */
  public unbindAll(): this {
    for (const { binding, instance } of [...this.activated]) {
      Guards.getLifecycle(binding).onDeactivated?.(instance, this);
    }

    this.activated.length = 0;
    this.bindings.clear();
    this.instances.clear();

    return this;
  }

  /**
   * Retrieves a service from this container.
   */
  public get<T>(token: Identifier<T>): T;
  public get<T>(token: Identifier<T>, options: { multi: true }): Array<T>;
  public get<T>(token: Identifier<T>, options: { optional: true }): T | undefined;
  public get<T>(token: Identifier<T>, options: { multi: true; optional: true }): Array<T> | undefined;
  public get<T>(token: Identifier<T>, options: { lazy: true }): () => T;
  public get<T>(token: Identifier<T>, options: { lazy: true; multi: true }): () => Array<T>;
  public get<T>(token: Identifier<T>, options: { lazy: true; optional: true }): () => T | undefined;
  public get<T>(token: Identifier<T>, options: { lazy: true; multi: true; optional: true }): () => Array<T> | undefined;
  public get<T>(
    token: Identifier<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: false }
  ): T | Array<T> | undefined;
  public get<T>(
    token: Identifier<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: boolean }
  ): T | Array<T> | undefined | (() => T | Array<T> | undefined);
  public get<T>(
    token: Identifier<T>,
    options?: { optional?: boolean; multi?: boolean; lazy?: boolean }
  ): T | Array<T> | undefined | (() => T | Array<T> | undefined) {
    const lazy = options?.lazy ?? false;

    if (lazy) {
      return () => this.get(token, { ...options, lazy: false });
    }

    const optional = options?.optional ?? false;

    if (!this.bindings.has(token)) {
      if (this.parent) {
        return this.parent.get(token, { ...options, lazy: false });
      }

      if (optional) {
        return undefined;
      }

      throw new NoBindingFoundError(token);
    }

    const bindings = assertPresent(this.bindings.get(token));
    const values = injectionContext(this).run(() => bindings.flatMap((binding) => this.resolveBinding(binding)));

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
   */
  public createChild(): Container {
    return new Container(this);
  }

  /**
   * Returns whether this container or one of its parents has one or more bindings for this token.
   *
   * @param token
   */
  public has<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Returns whether this container itself has one or more bindings for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   */
  public hasOwn<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Resolves values for a single binding, applying scope caching and activation hooks.
   *
   * @param binding - Binding to resolve.
   */
  private resolveBinding<T>(binding: Binding<T>): Array<T> {
    // Service redirections delegate to their target token and never own the produced values.
    if (Guards.isServiceRedirectionDescriptor(binding)) {
      return this.factory.construct(binding);
    }

    if (Guards.getScope(binding) === "Transient") {
      return this.factory.construct(binding).map((value) => this.activate(binding, value));
    }

    const constructed = this.instances.get(binding);

    if (constructed) {
      return constructed;
    }

    const values = this.factory.construct(binding).map((value) => this.activate(binding, value));

    this.commit(binding, values);

    return values;
  }

  /**
   * Runs the binding activation hook for a freshly constructed value.
   *
   * @param binding - Binding that constructed the value.
   * @param instance - Constructed value.
   * @returns The constructed value, or its replacement returned by the hook.
   */
  private activate<T>(binding: Binding<T>, instance: T): T {
    const handler = Guards.getLifecycle(binding).onActivated;

    if (!handler) {
      return instance;
    }

    const replaced = handler(instance, this) as T | undefined;

    return replaced === undefined ? instance : replaced;
  }

  /**
   * Caches singleton values of a binding and records them for later deactivation.
   *
   * @param binding - Binding that constructed the values.
   * @param values - Constructed values.
   */
  private commit<T>(binding: Binding<T>, values: Array<T>): void {
    this.instances.set(binding, values);
    values.forEach((instance) => this.activated.push({ token: getBindingToken(binding), binding, instance }));
  }

  /**
   * Deactivates all container-owned values of a token in creation order.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: Identifier<T>): void {
    const records = this.activated.filter((record) => record.token === token);

    for (const record of records) {
      Guards.getLifecycle(record.binding).onDeactivated?.(record.instance, this);

      this.activated.splice(this.activated.indexOf(record), 1);
    }
  }

  /**
   * Checks whether any binding registered for the token has already constructed values.
   *
   * @param token - Token to check.
   */
  private hasConstructedBinding<T>(token: Identifier<T>): boolean {
    return (this.bindings.get(token) ?? []).some((binding) => this.instances.has(binding));
  }

  private serviceRedirectionAlreadyBound(token: Identifier<unknown>, service: Identifier<unknown>): boolean {
    return (this.bindings.get(token) ?? []).some(
      (it) => Guards.isServiceRedirectionDescriptor(it) && it.token === token && it.service === service
    );
  }
}

interface BindingMap extends Map<Identifier<unknown>, Array<Binding<unknown>>> {
  get<T>(key: Identifier<T>): Array<Binding<T>> | undefined;

  set<T>(key: Identifier<T>, value: Array<Binding<T>>): this;
}

/**
 * Lifecycle hook parameters make `Binding<T>` invariant in `T`,
 * so internal storage is keyed by an any-typed binding.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBinding = Binding<any>;

interface InstanceMap extends Map<AnyBinding, Array<unknown>> {
  get<T>(key: Binding<T>): Array<T> | undefined;

  set<T>(key: Binding<T>, value: Array<T>): this;
}

interface ActivationRecord {
  token: Identifier<unknown>;
  binding: AnyBinding;
  instance: unknown;
}

/**
 * Resolves the token to unbind from a token or binding argument.
 *
 * @param target - Token or binding.
 * @returns The token the binding is registered under, or the token itself.
 */
function resolveBindingToken<T>(target: Identifier<T> | Binding<T>): Identifier<T> {
  if (typeof target === "object" && target !== null && "token" in target) {
    return getBindingToken(target as Binding<T>);
  }

  return target as Identifier<T>;
}
