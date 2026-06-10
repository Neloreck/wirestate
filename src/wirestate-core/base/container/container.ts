import { BindingDescriptor } from "../binding/binding";
import { getBindingLifecycle, getBindingScope } from "../binding/binding-lifecycle";
import { injectionContext } from "../context";
import { NoBindingFoundError } from "../errors";
import { Identifier } from "../tokens";

import { ActivationRecord, BindingMap, InstanceMap } from "./binding-storage";
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
   * Binds a binding descriptor to this container, replacing any binding
   * previously registered for the same token.
   *
   * @param binding - Binding descriptor to register.
   * @returns The same container for chaining.
   *
   * @throws {@link Error} If the descriptor is invalid or the token's existing
   * binding already constructed values.
   */
  public bind<T>(binding: BindingDescriptor<T>): this {
    const token = binding?.token;

    validateBinding(token, binding, this.hasConstructedBinding(token));

    this.bindings.set(token, binding);

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

    const binding = this.bindings.get(token);

    if (binding) {
      this.instances.delete(binding);
    }

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
   * `lazy` returns a thunk resolving on first call.
   * @returns The resolved value, thunk, or `undefined` for optional misses.
   *
   * @throws {@link NoBindingFoundError} If the token is not bound and not optional.
   */
  public get<T>(token: Identifier<T>): T;
  public get<T>(token: Identifier<T>, options: { optional: true }): T | undefined;
  public get<T>(token: Identifier<T>, options: { lazy: true }): () => T;
  public get<T>(token: Identifier<T>, options: { lazy: true; optional: true }): () => T | undefined;
  public get<T>(token: Identifier<T>, options?: { optional?: boolean; lazy?: false }): T | undefined;
  public get<T>(
    token: Identifier<T>,
    options?: { optional?: boolean; lazy?: boolean }
  ): T | undefined | (() => T | undefined);
  public get<T>(
    token: Identifier<T>,
    options?: { optional?: boolean; lazy?: boolean }
  ): T | undefined | (() => T | undefined) {
    const lazy = options?.lazy ?? false;

    if (lazy) {
      return () => this.get(token, { ...options, lazy: false });
    }

    const binding = this.bindings.get(token);

    if (!binding) {
      if (this.parent) {
        return this.parent.get(token, { ...options, lazy: false });
      }

      if (options?.optional) {
        return undefined;
      }

      throw new NoBindingFoundError(token);
    }

    return injectionContext(this).run(() => this.resolve(binding));
  }

  /**
   * Returns whether this container or one of its parents has a binding for this token.
   *
   * @param token - Token to check.
   * @returns Whether the token can be resolved from this container.
   */
  public has<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Returns whether this container itself has a binding for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   * @returns Whether this container owns a binding for the token.
   */
  public hasOwn<T>(token: Identifier<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Resolves the value for a binding descriptor, applying scope caching and activation hooks.
   *
   * @param binding - Binding descriptor to resolve.
   * @returns The resolved value.
   */
  private resolve<T>(binding: BindingDescriptor<T>): T {
    if (getBindingScope(binding) === "Transient") {
      return this.activate(binding, this.factory.construct(binding));
    }

    if (this.instances.has(binding)) {
      return this.instances.get(binding) as T;
    }

    const value = this.activate(binding, this.factory.construct(binding));

    this.commit(binding, value);

    return value;
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
   * Caches the singleton value of a binding descriptor and records it for later deactivation.
   *
   * @param binding - Binding descriptor that constructed the value.
   * @param value - Constructed value.
   */
  private commit<T>(binding: BindingDescriptor<T>, value: T): void {
    this.instances.set(binding, value);
    this.activated.push({ token: binding.token, binding, instance: value });
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
   * Checks whether the binding registered for the token has already constructed values.
   *
   * @param token - Token to check.
   * @returns Whether a constructed value exists for the token.
   */
  private hasConstructedBinding<T>(token: Identifier<T>): boolean {
    const binding = this.bindings.get(token);

    return binding !== undefined && this.instances.has(binding);
  }
}
