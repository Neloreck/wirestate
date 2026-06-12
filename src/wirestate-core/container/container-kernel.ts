import { BindingDescriptor } from "../binding/binding";
import { isInstanceDescriptor } from "../binding/binding-guards";
import { getBindingScope } from "../binding/binding-lifecycle";
import { Identifier } from "../binding/tokens";
import { NoBindingFoundError } from "../error/no-binding-found-error";
import { Newable } from "../utils/class-like";

import { ActivationRecord, BindingMap, InstanceMap } from "./binding-storage";
import { injectionContext } from "./context";
import { Factory } from "./factory";
import { activateInstance, deactivateInstance, rollbackInstanceActivation } from "./instance-lifecycle";
import { validateBinding } from "./validate-binding";

/**
 * Intercepts container unbind operations before any value is deactivated.
 *
 * @remarks
 * Interceptors let external orchestration, such as provider deprovisioning,
 * run ahead of binding deactivation without the container importing it.
 */
export interface UnbindInterceptor {
  /**
   * Called before a token's container-owned values are deactivated by {@link ContainerKernel.unbind}.
   *
   * @param token - Token being unbound.
   */
  onUnbind?(token: Identifier<unknown>): void;

  /**
   * Called exactly once before container-owned values are deactivated by {@link ContainerKernel.unbindAll}.
   */
  onUnbindAll?(): void;
}

/**
 * A dependency injection (DI) container will keep track of all bindings
 * and hold the actual instances of your services.
 *
 * All bindings are explicit: services are constructed synchronously and
 * only when a binding descriptor was registered with {@link ContainerKernel.bind}.
 */
export class ContainerKernel {
  /**
   * Parent container when this container was created as a child container.
   */
  public readonly parent?: ContainerKernel;

  private readonly bindings: BindingMap = new Map();
  private readonly instances: InstanceMap = new Map();
  private readonly activated: Array<ActivationRecord> = [];
  private readonly unbindInterceptors: Array<UnbindInterceptor> = [];
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
   * Unbind interceptors run first, so deprovision orchestration precedes deactivation.
   *
   * @param token - Token to unbind.
   * @returns The same container for chaining.
   */
  public unbind<T>(token: Identifier<T>): this {
    for (const interceptor of [...this.unbindInterceptors]) {
      interceptor.onUnbind?.(token);
    }

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
   * Unbind interceptors run first, so deprovision orchestration precedes
   * deactivation. Bindings stay resolvable until every deactivation handler has
   * run, so deactivating services can still talk to each other.
   *
   * @returns The same container for chaining.
   */
  public unbindAll(): this {
    for (const interceptor of [...this.unbindInterceptors]) {
      interceptor.onUnbindAll?.();
    }

    for (const record of [...this.activated]) {
      this.deactivateRecord(record);
    }

    this.activated.length = 0;
    this.bindings.clear();
    this.instances.clear();

    return this;
  }

  /**
   * Registers an interceptor invoked before {@link ContainerKernel.unbind} and
   * {@link ContainerKernel.unbindAll} deactivate container-owned values.
   *
   * @param interceptor - Interceptor to register.
   * @returns A callback removing the interceptor.
   */
  public addUnbindInterceptor(interceptor: UnbindInterceptor): () => void {
    this.unbindInterceptors.push(interceptor);

    return () => {
      const index = this.unbindInterceptors.indexOf(interceptor);

      if (index !== -1) {
        this.unbindInterceptors.splice(index, 1);
      }
    };
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
   * Returns the binding descriptors registered on this container in registration order,
   * ignoring parent containers.
   *
   * @returns Snapshot of this container's own binding descriptors.
   */
  public getOwnBindings(): ReadonlyArray<BindingDescriptor<unknown>> {
    return Array.from(this.bindings.values());
  }

  /**
   * Returns the service instances this container constructed for instance bindings,
   * in creation order. Values constructed for value and factory bindings are not
   * service instances and are not included.
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
      disposers: [],
    };

    if (isInstanceDescriptor(binding)) {
      try {
        activateInstance(this, record);
      } catch (error) {
        rollbackInstanceActivation(this, record);

        throw error;
      }
    }

    this.commit(record);

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
   * Deactivates all container-owned values of a token in creation order.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: Identifier<T>): void {
    const records = this.activated.filter((record) => record.token === token);

    for (const record of records) {
      this.deactivateRecord(record);

      this.activated.splice(this.activated.indexOf(record), 1);
    }
  }

  /**
   * Deactivates one container-owned value: instance bindings run Wirestate
   * lifecycle cleanup, other binding kinds are simply dropped.
   *
   * @param record - Activation record being deactivated.
   */
  private deactivateRecord(record: ActivationRecord): void {
    if (isInstanceDescriptor(record.binding)) {
      deactivateInstance(this, record);
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
