import { getActivationAdapter } from "../activation/activation-adapter";
import { type Binding, type BindingDescriptor, type ServiceToken } from "../binding/binding";
import { isInstanceDescriptor } from "../binding/binding-guards";
import { getBindingScope } from "../binding/binding-lifecycle";
import { tokenToString } from "../binding/binding-tokens";
import { validateBinding } from "../binding/binding-validation";
import { ERROR_CODE_CONTAINER_DESTROYED, ERROR_CODE_NO_BINDING_FOUND } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { getLatestHotClass } from "../hot/hot-registry";
import { remapHotBinding } from "../hot/hot-remap";
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

  /**
   * Tokens the container owns rather than the caller, so `unbindAll` keeps them.
   *
   * @remarks
   * A bare kernel retains nothing. {@link Container} marks its own self-binding and every
   * binding a plugin's `install` contributed.
   */
  private readonly retained: Set<ServiceToken> = new Set();

  private readonly bindings: BindingMap = new Map();
  private readonly instances: InstanceMap = new Map();
  private readonly activated: Array<ActivationRecord> = [];
  private readonly factory: Factory;

  private destroyed: boolean = false;

  /**
   * Whether {@link ContainerKernel.destroy} is running its deactivation pass.
   */
  private destroying: boolean = false;

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
    this.assertUsable();

    binding = this.getHotBinding(binding);

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
    this.assertUsable();

    token = this.getHotToken(token);

    this.deactivate(token);

    const binding = this.bindings.get(token);

    if (binding) {
      this.instances.delete(binding);
    }

    this.bindings.delete(token);

    return this;
  }

  /**
   * Resets the container by unbinding every caller-registered binding, deactivating the values
   * they constructed in reverse creation order, so a dependent's `@OnDeactivation` runs before
   * its dependencies tear down. Bindings stay resolvable until every deactivation handler has
   * run, so deactivating services can still talk to each other.
   *
   * @remarks
   * The container stays usable: bindings it owns rather than the caller survive, so
   * `inject(Container)` and any bus a plugin installed keep resolving and the container can be
   * re-populated and re-provisioned. A bare {@link ContainerKernel} owns nothing, so every
   * binding is removed. Use {@link destroy} to tear the container down for good.
   *
   * @returns The same container for chaining.
   *
   * @throws {@link WirestateError} If the container was destroyed.
   */
  public unbindAll(): this {
    this.assertUsable();

    const kept: Array<ActivationRecord> = [];
    const dropped: Array<ActivationRecord> = [];

    for (const record of this.activated) {
      (this.retained.has(record.token) ? kept : dropped).push(record);
    }

    // Detached before dispatching, not after: an `@OnDeactivation` that re-enters teardown would
    // otherwise still find these records and run them a second time, and a hook re-entering
    // `unbindAll` itself would recurse without end.
    this.activated.length = 0;
    this.activated.push(...kept);

    for (let index: number = dropped.length - 1; index >= 0; index -= 1) {
      this.deactivateRecord(dropped[index]);
    }

    for (const [token, binding] of [...this.bindings]) {
      if (!this.retained.has(token)) {
        this.bindings.delete(token);
        this.instances.delete(binding);
      }
    }

    return this;
  }

  /**
   * Tears the container down for good, deactivating every value it constructed - retained
   * bindings included - in reverse creation order.
   *
   * @remarks
   * Terminal, unlike {@link unbindAll}: a destroyed container throws on `bind`, `unbind`,
   * `unbindAll`, and every `get`, including `{ optional: true }`. Enforcing that is the point -
   * a destroyed container that still answered lookups would resolve its parent's bindings and
   * hand callers the wrong scope.
   *
   * Inspection stays available so teardown code can still read the container: `has`, `hasOwn`,
   * `getOwnBindings`, and `getActiveInstances` do not throw, and `has` reports `false` rather
   * than an ancestor's binding. Idempotent, so teardown paths can call it freely - including
   * re-entrantly from an `@OnDeactivation` hook this very call is running, where the nested call
   * returns without starting a second teardown.
   *
   * @returns The same container for chaining.
   */
  public destroy(): this {
    if (this.destroyed || this.destroying) {
      return this;
    }

    this.destroying = true;

    try {
      // Drained before dispatching, not after: an `@OnDeactivation` that re-enters teardown would
      // otherwise still find these records and run them a second time.
      const records: ReadonlyArray<ActivationRecord> = this.activated.splice(0).reverse();

      for (const record of records) {
        this.deactivateRecord(record);
      }

      this.bindings.clear();
      this.instances.clear();
      this.retained.clear();

      this.destroyed = true;
    } finally {
      this.destroying = false;
    }

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
   *   Errors thrown by a binding's constructor or factory propagate unchanged.
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
    this.assertUsable();

    if (options?.lazy) {
      return () => this.get(token, { ...options, lazy: false });
    }

    token = this.getHotToken(token);

    const own: Optional<BindingDescriptor<T>> = this.bindings.get(token);

    if (own) {
      return this.resolve(own);
    }

    let current: Optional<ContainerKernel> = this.parent;

    while (current) {
      const binding: Optional<BindingDescriptor<T>> = current.bindings.get(token);

      if (binding) {
        return current.resolve(binding);
      }

      current = current.parent;
    }

    if (options?.optional) {
      return undefined;
    }

    // If cannot find and have destroyed parent, surface the guess because it may be not as obvious otherwise.
    if (this.findDestroyedAncestor()) {
      throw new WirestateError(
        `No binding(s) found for '${tokenToString(token)}': a parent container was destroyed, so the bindings it ` +
          `provided are gone. Destroy a container only once nothing resolves through it.`,
        ERROR_CODE_CONTAINER_DESTROYED
      );
    } else {
      throw new WirestateError(`No binding(s) found for '${tokenToString(token)}'.`, ERROR_CODE_NO_BINDING_FOUND);
    }
  }

  /**
   * Returns whether this container or one of its parents has a binding for this token.
   *
   * @param token - Token to check.
   * @returns Whether the token can be resolved from this container.
   */
  public has<T>(token: ServiceToken<T>): boolean {
    return this.hasBinding(this.getHotToken(token));
  }

  /**
   * Returns whether this container itself has a binding for this token,
   * ignoring parent containers.
   *
   * @param token - Token to check.
   * @returns Whether this container owns a binding for the token.
   */
  public hasOwn<T>(token: ServiceToken<T>): boolean {
    return this.bindings.has(this.getHotToken(token));
  }

  /**
   * Checks the parent chain for a binding, without hot-reload rewriting.
   *
   * @remarks
   * Separate from {@link ContainerKernel.has} so {@link ContainerKernel.getHotToken} can test a
   * candidate token without recursing back through the rewrite.
   *
   * @param token - Token to look up as given.
   * @returns Whether the token is bound on this container or an ancestor.
   */
  private hasBinding<T>(token: ServiceToken<T>): boolean {
    // A destroyed container resolves nothing, so it must not report an ancestor's binding as its
    // own answer. Introspection stays non-throwing, unlike `get`, so teardown code can still ask.
    if (this.destroyed) {
      return false;
    }

    return this.bindings.has(token) || (this.parent?.hasBinding(token) ?? false);
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
   * Rewrites a token to the newest generation of a hot-replaced class.
   *
   * @remarks
   * Development-only, and the single place that decision is made: every public API taking a
   * token routes through it, so hot-reload support cannot drift between them. Modules that were
   * not part of a hot update keep referencing an older generation of a replaced class, and this
   * keeps those references answerable after a container hot swap.
   *
   * The newest generation is used only when it is actually bound in this chain. Containers bound
   * before the update, such as external containers no provider owns, keep the original token.
   *
   * In production the guard folds away and this returns its argument.
   *
   * @param token - Token supplied by the caller.
   * @returns Token to look the binding up by.
   */
  protected getHotToken<T>(token: ServiceToken<T>): ServiceToken<T> {
    if (process.env.NODE_ENV === "production") {
      return token;
    } else {
      const latest: ServiceToken<T> = getLatestHotClass(token);

      return latest !== token && this.hasBinding(latest) ? latest : token;
    }
  }

  /**
   * Rewrites a binding to the newest generations of the classes it references.
   *
   * @remarks
   * The registration counterpart of {@link ContainerKernel.getHotToken}, keeping registration keys
   * consistent with lookups no matter which code path constructed the container. In production
   * the guard folds away and this returns its argument.
   *
   * @template T - Bound value type.
   *
   * @param binding - Binding supplied by the caller.
   * @returns Binding to register.
   */
  protected getHotBinding<T>(binding: Newable<object> | BindingDescriptor<T>): Newable<object> | BindingDescriptor<T> {
    if (process.env.NODE_ENV === "production") {
      return binding;
    } else {
      return remapHotBinding(binding as Binding) as Newable<object> | BindingDescriptor<T>;
    }
  }

  /**
   * Resolves the value for a binding descriptor, applying scope caching and
   * instance lifecycle wiring.
   *
   * @param binding - Binding descriptor to resolve.
   * @returns The resolved value.
   */
  private resolve<T>(binding: BindingDescriptor<T>): T {
    const transient: boolean = getBindingScope(binding) === "Transient";

    // Hot path: a cached singleton is returned without entering an injection context. The context
    // (and its closure + try/finally swap) is only needed while constructing, so a cached get() -
    // the most common operation - allocates nothing.
    if (!transient && this.instances.has(binding)) {
      return this.instances.get(binding) as T;
    }

    // Construction runs inside an injection context so `inject()` in constructors, field
    // initializers, and (post-commit) @OnActivation hooks resolves against this container.
    return injectionContext(this).run(() => {
      if (transient) {
        return this.factory.construct(binding);
      }

      const record: ActivationRecord = {
        token: binding.token,
        binding,
        instance: this.factory.construct(binding),
      };

      // Commit to the cache before dispatching activation. An @OnActivation hook that transitively
      // resolves the same token then gets this instance from the cache, instead of silently
      // constructing a duplicate singleton or recursing until the stack overflows.
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
    });
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
   * Deactivates the container-owned value of a token.
   *
   * @remarks
   * A token holds at most one activation record - `commit` is guarded by the instance cache, and
   * `bind` rejects rebinding a token whose binding already constructed - so this needs no teardown
   * ordering of its own. Ordering across several instances belongs to {@link unbindAll}.
   *
   * @param token - Token to deactivate.
   */
  private deactivate<T>(token: ServiceToken<T>): void {
    const records: Array<ActivationRecord> = [];

    for (let index: number = this.activated.length - 1; index >= 0; index -= 1) {
      if (this.activated[index].token === token) {
        records.push(this.activated[index]);
        this.activated.splice(index, 1);
      }
    }

    for (const record of records) {
      this.deactivateRecord(record);
    }
  }

  /**
   * Marks a token as container-owned, so {@link unbindAll} keeps its binding and instance.
   *
   * @remarks
   * For composition roots to declare the infrastructure a reset must not take away. Only
   * {@link destroy} removes a retained binding.
   *
   * @internal
   *
   * @param token - Token the container owns.
   */
  protected retainBinding(token: ServiceToken): void {
    this.retained.add(token);
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

  /**
   * Returns the nearest destroyed ancestor, if the parent chain holds one.
   *
   * @remarks
   * Containers keep no child pointers by design, so `destroy` cannot cascade downwards. A
   * descendant therefore stays live over a destroyed ancestor and only notices when a lookup that
   * used to resolve through it misses.
   *
   * @returns The nearest destroyed ancestor, or `undefined` when the chain is intact.
   */
  private findDestroyedAncestor(): Optional<ContainerKernel> {
    let current: Optional<ContainerKernel> = this.parent;

    while (current) {
      if (current.destroyed) {
        return current;
      }

      current = current.parent;
    }

    return undefined;
  }

  /**
   * Throws when the container was destroyed.
   *
   * @remarks
   * A destroyed container is a precondition failure rather than a structural miss, so this
   * throws for `{ optional: true }` lookups too - the same rule `inject()` applies outside an
   * injection context. Without it a destroyed child would silently resolve its parent's
   * bindings, handing callers the wrong scope.
   *
   * @throws {@link WirestateError} If the container was destroyed.
   */
  protected assertUsable(): void {
    if (this.destroyed) {
      throw new WirestateError(
        "Container was destroyed and cannot be used again. Create a new container instead.",
        ERROR_CODE_CONTAINER_DESTROYED
      );
    }
  }
}
