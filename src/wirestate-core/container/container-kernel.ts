import { getActivationAdapter } from "../activation/activation-adapter";
import { type BindingDescriptor, type ServiceToken } from "../binding/binding";
import { isInstanceDescriptor } from "../binding/binding-guards";
import { getBindingScope } from "../binding/binding-lifecycle";
import { tokenToString } from "../binding/binding-tokens";
import { validateBinding } from "../binding/binding-validation";
import { ERROR_CODE_NO_BINDING_FOUND } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { type Optional, type Newable } from "../types/general";

import { injectionContext } from "./container-context";
import { Factory } from "./container-factory";
import { type ActivationRecord, type BindingMap, type InstanceMap } from "./container-storage";

/**
 * Internal dependency injection (DI) engine: tracks bindings and holds the
 * resolved instances of your services.
 *
 * @remarks
 * This is the base class that {@link Container} extends. The public
 * {@link Container} adds messaging and scope support on top. Application
 * code interacts with `Container`, not `ContainerKernel` directly.
 *
 * All bindings are explicit: services are constructed synchronously and
 * only when a binding descriptor was registered with `bind`.
 */
export class ContainerKernel {
  /**
   * Parent container when this container was created as a child container.
   */
  public readonly parent?: ContainerKernel;

  private readonly bindings: BindingMap = new Map();
  private readonly instances: InstanceMap = new Map();
  private readonly activated: Array<ActivationRecord> = [];
  private readonly factory: Factory;

  public constructor(parent?: ContainerKernel) {
    this.parent = parent;
    this.factory = new Factory(this);
  }

  /**
   * Binds a service class or a binding descriptor to this container, replacing
   * any binding previously registered for the same token.
   *
   * @remarks
   * A bare class is its own token and binds as a singleton instance binding:
   * `container.bind(MyService)` is equivalent to
   * `container.bind({ token: MyService, type: "Instance", value: MyService })`.
   *
   * @param binding - Service class or binding descriptor to register.
   * @returns The same container for chaining.
   *
   * @throws {@link WirestateError} If the binding is invalid or the token's existing
   * binding already constructed values.
   */
  public bind<T>(binding: Newable<object> | BindingDescriptor<T>): this {
    const descriptor: BindingDescriptor<T> =
      typeof binding === "function"
        ? ({ token: binding, type: "Instance", value: binding } as unknown as BindingDescriptor<T>)
        : binding;
    const token = descriptor?.token;

    validateBinding(token, descriptor, this.hasConstructedBinding(token));

    this.bindings.set(token, descriptor);

    return this;
  }

  /**
   * Unbinds a token, deactivating every container-owned value it constructed.
   *
   * @param token - Token to unbind.
   * @returns The same container for chaining.
   */
  public unbind<T>(token: ServiceToken<T>): this {
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
    for (const record of [...this.activated]) {
      this.deactivateRecord(record);
    }

    this.activated.length = 0;
    this.bindings.clear();
    this.instances.clear();

    return this;
  }

  /**
   * Retrieves a service from this container.
   *
   * Resolution options can make a lookup optional or lazy. Optional lookups
   * resolve `undefined` instead of throwing. Lazy lookups return a thunk that
   * resolves on first call.
   *
   * @param token - Token to resolve.
   * @returns The resolved value, thunk, or `undefined` for optional misses.
   *
   * @throws {@link WirestateError} If the token is not bound and not optional,
   *   or if a circular dependency is detected while constructing the value.
   *   Errors thrown by a binding's constructor or actory propagate unchanged.
   */
  public get<T>(token: ServiceToken<T>): T;
  public get<T>(token: ServiceToken<T>, options: { optional: true }): Optional<T>;
  public get<T>(token: ServiceToken<T>, options: { lazy: true }): () => T;
  public get<T>(token: ServiceToken<T>, options: { lazy: true; optional: true }): () => Optional<T>;
  public get<T>(token: ServiceToken<T>, options?: { optional?: boolean; lazy?: false }): Optional<T>;
  public get<T>(
    token: ServiceToken<T>,
    options?: { optional?: boolean; lazy?: boolean }
  ): Optional<T> | (() => Optional<T>);
  public get<T>(
    token: ServiceToken<T>,
    options?: { optional?: boolean; lazy?: boolean }
  ): Optional<T> | (() => Optional<T>) {
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

      throw new WirestateError(`No binding(s) found for '${tokenToString(token)}'.`, ERROR_CODE_NO_BINDING_FOUND);
    }

    return injectionContext(this).run(() => this.resolve(binding));
  }

  /**
   * Returns whether this container or one of its parents has a binding for this token.
   *
   * @param token - Token to check.
   * @returns Whether the token can be resolved from this container.
   */
  public has<T>(token: ServiceToken<T>): boolean {
    return this.bindings.has(token) || (this.parent?.has(token) ?? false);
  }

  /**
   * Returns whether this container itself has a binding for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   * @returns Whether this container owns a binding for the token.
   */
  public hasOwn<T>(token: ServiceToken<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Returns the binding descriptors registered on this container in registration order,
   * ignoring parent containers.
   *
   * @returns Snapshot of this container's own binding descriptors.
   */
  public getOwnBindings(): ReadonlyArray<BindingDescriptor<unknown>> {
    return Array.from(this.bindings.values());
  }

  /**
   * Returns the service instances this container constructed for singleton instance
   * bindings, in creation order. Values constructed for value and factory bindings are
   * not service instances and are not included. Transient instances are excluded too. They
   * are construct-and-forget and never owned or tracked by the container.
   *
   * @returns Snapshot of this container's active service instances.
   */
  public getActiveInstances(): ReadonlyArray<object> {
    const instances: Array<object> = [];

    for (const record of this.activated) {
      if (isInstanceDescriptor(record.binding)) {
        instances.push(record.instance as object);
      }
    }

    return instances;
  }

  /**
   * Resolves the value for a binding descriptor, applying scope caching and
   * instance lifecycle wiring.
   *
   * @param binding - Binding descriptor to resolve.
   * @returns The resolved value.
   */
  private resolve<T>(binding: BindingDescriptor<T>): T {
    if (getBindingScope(binding) === "Transient") {
      return this.factory.construct(binding);
    }

    if (this.instances.has(binding)) {
      return this.instances.get(binding) as T;
    }

    const record: ActivationRecord = {
      token: binding.token,
      binding,
      instance: this.factory.construct(binding),
    };

    // Commit to the cache before dispatching activation.
    // An @OnActivation hook that transitively resolves the same token then gets this instance from the cache,
    // instead of silently constructing a duplicate singleton or recursing until the stack overflows.
    this.commit(record);

    if (isInstanceDescriptor(binding)) {
      const adapter = getActivationAdapter(this);

      if (adapter) {
        try {
          adapter.activate(this, record);
        } catch (error) {
          this.evict(record);

          adapter.rollback(this, record);

          throw error;
        }
      }
    }

    return record.instance as T;
  }

  /**
   * Caches the singleton value of a binding descriptor and records it for later deactivation.
   *
   * @param record - Activation record holding the constructed value.
   */
  private commit(record: ActivationRecord): void {
    this.instances.set(record.binding, record.instance);
    this.activated.push(record);
  }

  /**
   * Removes a record committed before activation when that activation fails, undoing {@link commit}
   * so a failed instance is never cached or scheduled for deactivation.
   *
   * @param record - Activation record to evict.
   */
  private evict(record: ActivationRecord): void {
    this.instances.delete(record.binding);

    const index: number = this.activated.indexOf(record);

    if (index !== -1) {
      this.activated.splice(index, 1);
    }
  }

  /**
   * Deactivates all container-owned values of a token in creation order.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: ServiceToken<T>): void {
    const records = this.activated.filter((record) => record.token === token);

    for (const record of records) {
      this.deactivateRecord(record);

      this.activated.splice(this.activated.indexOf(record), 1);
    }
  }

  /**
   * Deactivates one container-owned value.
   * Instance bindings run the installed activation adapter's cleanup.
   * Other binding kinds are dropped from the active record map.
   *
   * @param record - Activation record being deactivated.
   */
  private deactivateRecord(record: ActivationRecord): void {
    if (isInstanceDescriptor(record.binding)) {
      getActivationAdapter(this)?.deactivate(this, record);
    }
  }

  /**
   * Checks whether the binding registered for the token has already constructed values.
   *
   * @param token - Token to check.
   * @returns Whether a constructed value exists for the token.
   */
  private hasConstructedBinding<T>(token: ServiceToken<T>): boolean {
    const binding = this.bindings.get(token);

    return binding !== undefined && this.instances.has(binding);
  }
}
