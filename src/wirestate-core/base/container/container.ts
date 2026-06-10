import type { BindingDescriptor } from "../binding/binding";
import { isMultiBinding, isServiceRedirectionDescriptor } from "../binding/binding-guards";
import { getBindingLifecycle, getBindingScope } from "../binding/binding-lifecycle";
import { injectionContext } from "../context";
import { NoBindingFoundError } from "../errors";
import { type Identifier, toString } from "../tokens";
import { assertPresent, assertSingle } from "../utils/asserts";

import type { ActivationRecord, BindingMap, InstanceMap } from "./binding-storage";
import { Factory } from "./factory";
import { validateBinding } from "./validate-binding";

/**
 * A dependency injection (DI) container will keep track of all bindings
 * and hold the actual instances of your services.
 *
 * All bindings are explicit: services are constructed synchronously and
 * only when a binding descriptor was registered with {@link Container.bind}.
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
   * Binds a binding descriptor to this container.
   *
   * @param binding - Binding descriptor to register.
   * @returns The same container for chaining.
   *
   * @throws {@link Error} If the descriptor is invalid for the token's existing bindings.
   */
  public bind<T>(binding: BindingDescriptor<T>): this {
    const token = binding.token;
    const existing = this.bindings.get(token) ?? [];

    validateBinding(token, binding, existing, this.hasConstructedBinding(token));

    this.bindings.set(token, isMultiBinding(binding) ? [...existing, binding] : [binding]);

    return this;
  }

  /**
   * Unbinds a token, deactivating every container-owned value it constructed.
   *
   * @param token - Token to unbind.
   * @returns The same container for chaining.
   */
  public unbind<T>(token: Identifier<T>): this {
    this.deactivate(token);

    this.bindings.get(token)?.forEach((binding) => this.instances.delete(binding));
    this.bindings.delete(token);

    return this;
  }

  /**
   * Unbinds all bindings, deactivating container-owned values in creation order.
   * Bindings stay resolvable until every deactivation handler has run, so
   * deactivating services can still talk to each other.
   *
   * @returns The same container for chaining.
   */
  public unbindAll(): this {
    for (const { binding, instance } of [...this.activated]) {
      getBindingLifecycle(binding).onDeactivated?.(instance, this);
    }

    this.activated.length = 0;
    this.bindings.clear();
    this.instances.clear();

    return this;
  }

  /**
   * Retrieves a service from this container.
   *
   * @param token - Token to resolve.
   * @param options - Resolution options: `optional` resolves `undefined` instead of throwing,
   * `multi` returns every bound value, `lazy` returns a thunk resolving on first call.
   * @returns The resolved value, values, thunk, or `undefined` for optional misses.
   *
   * @throws {@link NoBindingFoundError} If the token is not bound and not optional.
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
   * Returns whether this container or one of its parents has one or more bindings for this token.
   *
   * @param token - Token to check.
   * @returns Whether the token can be resolved from this container.
   */
  public has<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Returns whether this container itself has one or more bindings for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   * @returns Whether this container owns a binding for the token.
   */
  public hasOwn<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Resolves values for a single binding descriptor, applying scope caching and activation hooks.
   *
   * @param binding - Binding descriptor to resolve.
   * @returns The resolved values.
   */
  private resolveBinding<T>(binding: BindingDescriptor<T>): Array<T> {
    // Service redirections delegate to their target token and never own the produced values.
    if (isServiceRedirectionDescriptor(binding)) {
      return this.factory.construct(binding);
    }

    if (getBindingScope(binding) === "Transient") {
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
   * @param binding - Binding descriptor that constructed the value.
   * @param instance - Constructed value.
   * @returns The constructed value, or its replacement returned by the hook.
   */
  private activate<T>(binding: BindingDescriptor<T>, instance: T): T {
    const handler = getBindingLifecycle(binding).onActivated;

    if (!handler) {
      return instance;
    }

    const replaced = handler(instance, this) as T | undefined;

    return replaced === undefined ? instance : replaced;
  }

  /**
   * Caches singleton values of a binding descriptor and records them for later deactivation.
   *
   * @param binding - Binding descriptor that constructed the values.
   * @param values - Constructed values.
   */
  private commit<T>(binding: BindingDescriptor<T>, values: Array<T>): void {
    this.instances.set(binding, values);
    values.forEach((instance) => this.activated.push({ token: binding.token, binding, instance }));
  }

  /**
   * Deactivates all container-owned values of a token in creation order.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: Identifier<T>): void {
    const records = this.activated.filter((record) => record.token === token);

    for (const record of records) {
      getBindingLifecycle(record.binding).onDeactivated?.(record.instance, this);

      this.activated.splice(this.activated.indexOf(record), 1);
    }
  }

  /**
   * Checks whether any binding registered for the token has already constructed values.
   *
   * @param token - Token to check.
   * @returns Whether constructed values exist for the token.
   */
  private hasConstructedBinding<T>(token: Identifier<T>): boolean {
    return (this.bindings.get(token) ?? []).some((binding) => this.instances.has(binding));
  }
}
