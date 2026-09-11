import { type MutableWireStatus, type ProvisionId, getMutableStatus } from "../activation/wire-status";
import { type Binding, type ServiceToken, BindingType } from "../binding/binding";
import { getBindingToken, tokenToString } from "../binding/binding-tokens";
import { type Container } from "../container/container";
import { type ContainerKernel } from "../container/container-kernel";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { reportWirestateError } from "../error/wirestate-error-handler";
import { callLifecycleHandler } from "../lifecycle/call-lifecycle-handler";
import { collectDeclaredProvisionHandlers } from "../lifecycle/declared-lifecycle-handlers";
import { getMessagingPluginHandledKinds } from "../plugin/messaging-plugin";
import { getMessagingRegistrations } from "../plugin/messaging-registration";
import {
  dispatchPluginContainerDeprovision,
  dispatchPluginContainerProvision,
  dispatchPluginDeprovision,
  dispatchPluginProvision,
  getEffectivePlugins,
  isPluginParticipant,
} from "../plugin/plugin-registry";
import { type Optional } from "../types/general";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";
import {
  type ProvisionCycleEntry,
  type ProvisionState,
  getOrCreateProvisionState,
  getProvisionState,
} from "./provision-state";

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * One atomic cycle: plugins observe the boundary, the bindings are validated, every participant is
 * resolved, plugins wire every active instance, and `@OnProvision` runs for each participant in
 * creation order. A throw anywhere unwinds whatever the cycle reached, on the same axis a completed
 * cycle tears down on, and leaves the container ready for another attempt.
 *
 * A container is provisioned by at most one provider at a time. Provisioning a container that is
 * already provisioned throws. Deprovision it first.
 *
 * @group Container
 * @internal
 *
 * @param container - Container entering provider ownership.
 * @param bindings - Bindings controlled by the provider.
 *
 * @throws {@link WirestateError} If the container is already provisioned, provisioning, or
 *   deprovisioning.
 */
export function provisionContainer(
  container: Container,
  bindings: ReadonlyArray<Binding> = container.getOwnBindings()
): void {
  const state: ProvisionState = getOrCreateProvisionState(container);

  assertProvisionCanStart(state);

  state.phase = "provisioning";

  // Plugins observe the boundary before any instance wiring. The dispatch unwinds its own earlier
  // hooks when one of them throws, so nothing else has been set up yet that would need rolling back.
  try {
    dispatchPluginContainerProvision(container);
  } catch (error) {
    state.phase = "idle";

    throw error;
  }

  try {
    validateBindings(container, bindings);

    const participants: ReadonlyArray<object> = resolveParticipants(container, state, bindings);

    markInFlight(container);
    wirePlugins(container, state);
    runProvisionHooks(container, participants);
    markProvisioned(container);

    state.phase = "provisioned";
  } catch (error) {
    releaseCycle(container, state);

    throw error;
  }
}

/**
 * Deprovisions a container for a framework provider.
 *
 * @remarks
 * Releases the whole cycle: every `@OnDeprovision` runs in reverse creation order while the buses
 * are still live, then plugin teardown and disposers unwind in the same direction, then plugins
 * observe the boundary. Idempotent: a container that is not currently provisioned is left alone,
 * and so is one whose running provision cycle owns its own rollback.
 *
 * @group Container
 * @internal
 *
 * @param container - Container leaving provider ownership.
 */
export function deprovisionContainer(container: Container): void {
  const state: Optional<ProvisionState> = getProvisionState(container);

  if (!state || state.releasing || state.phase !== "provisioned") {
    return;
  }

  releaseCycle(container, state);
}

/**
 * Releases one instance from the current provision cycle, ahead of its deactivation.
 *
 * @remarks
 * Runs for an instance the kernel is about to drop on `unbind`, so its `@OnDeprovision`, the
 * plugin teardown it is owed, and its disposers run while the container is still provisioned and
 * the buses still live. An instance the cycle never reached is left alone, and so is any instance
 * while a deprovision transaction already owns teardown.
 *
 * @group Container
 * @internal
 *
 * @param container - Container that owns the instance.
 * @param instance - Instance leaving the container.
 */
export function deprovisionContainerInstance(container: ContainerKernel, instance: object): void {
  const state: Optional<ProvisionState> = getProvisionState(container);
  const entry: Optional<ProvisionCycleEntry> = state?.cycle.get(instance);

  if (!state || !entry || state.releasing) {
    return;
  }

  state.releasing = true;

  try {
    deprovisionInstances(container, state, [instance]);

    // A disposer may register another one while it runs. Drain until the entry is quiet, since
    // nothing later sweeps an entry that leaves the cycle here.
    while (entry.disposers.length > 0) {
      runInstanceDisposers(entry);
    }

    state.cycle.delete(instance);
  } finally {
    state.releasing = false;
  }
}

/**
 * Guards against binding a handler-bearing service onto an already-provisioned container.
 *
 * @remarks
 * Messaging handlers and `@OnProvision`/`@OnDeprovision` hooks are wired only during a provision
 * cycle. Binding such a service after provision would leave its handlers silently dead until the
 * next cycle, contrary to the fail-fast posture everywhere else, so this throws instead. Plain
 * services (no messaging or provider-lifecycle hooks) bind freely - they activate lazily on the
 * next resolution and need no cycle.
 *
 * @internal
 *
 * @param container - Container being bound onto.
 * @param binding - Binding about to be registered.
 * @throws {@link WirestateError} If the container is provisioned and the binding declares messaging
 *   or provider-lifecycle handlers.
 */
export function assertBindableWhileProvisioned(container: ContainerKernel, binding: Binding): void {
  const state: Optional<ProvisionState> = getProvisionState(container);

  // Fires while the container is provisioned and during a live provision cycle alike.
  if (!state || state.phase === "idle") {
    return;
  }

  const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);
  const prototype: Optional<object> = getLifecyclePrototype(metadataToken);

  if (prototype && collectDeclaredProvisionHandlers(prototype).length > 0) {
    throw new WirestateError(
      `Cannot bind '${tokenToString(metadataToken)}' while the container is provisioned or provisioning: its ` +
        `messaging or provider-lifecycle handlers would not wire until the next provision cycle. Bind it before ` +
        `provisioning, or deprovision and reprovision the container.`,
      ERROR_CODE_VALIDATION_ERROR
    );
  }
}

/**
 * Rejects a provision attempt the container's current phase cannot accept.
 *
 * @param state - Provider lifecycle state of the container.
 *
 * @throws {@link WirestateError} If a cycle is held, running, or being released.
 */
function assertProvisionCanStart(state: ProvisionState): void {
  if (state.phase === "provisioned") {
    throw new WirestateError(
      "Container is already provisioned. Deprovision it before provisioning it again.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (state.phase === "provisioning") {
    throw new WirestateError(
      "Container is already provisioning. A provision cycle cannot start another one, for example " +
        "by calling provision() from an @OnProvision hook.",
      ERROR_CODE_VALIDATION_ERROR
    );
  } else if (state.releasing) {
    throw new WirestateError(
      "Container is deprovisioning. A deprovision cycle cannot start a provision cycle, for example " +
        "by calling provision() from an @OnDeprovision hook.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }
}

/**
 * Validates the bindings before provisioning: a provider-lifecycle participant must be bound on
 * this container, and every declared messaging handler must have a registered plugin that handles
 * its kind. Two passes, ordered so the ownership error wins over the unhandled-kind error.
 *
 * @remarks
 * Reading the lifecycle metadata here also validates it, so a class whose hierarchy declares
 * conflicting hooks fails the cycle up front instead of failing its teardown later.
 *
 * @param container - Container being provisioned.
 * @param bindings - Bindings controlled by the provider.
 * @throws {@link WirestateError} If a participant is not owned, or a handler kind is unhandled.
 */
function validateBindings(container: Container, bindings: ReadonlyArray<Binding>): void {
  // A container owns provider lifecycle only for the bindings it declares.
  for (const binding of bindings) {
    const token: ServiceToken = getBindingToken(binding);

    if (isProviderLifecycleParticipant(getProviderLifecycleMetadataToken(binding)) && !container.hasOwn(token)) {
      throw new WirestateError(
        `Cannot provision binding '${typeof token === "function" ? token.name : String(token)}' that is not bound on ` +
          `this container. Provider lifecycle is owned by the container that declares the binding.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }

  // Fail-fast: a class declaring a messaging handler whose kind no registered
  // plugin handles, e.g. an @OnEvent service with no EventsPlugin registered.
  const handledKinds: Set<symbol> = new Set();

  for (const plugin of getEffectivePlugins(container)) {
    for (const kind of getMessagingPluginHandledKinds(plugin)) {
      handledKinds.add(kind);
    }
  }

  for (const binding of bindings) {
    const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);
    const prototype: Optional<object> = getLifecyclePrototype(metadataToken);

    if (!prototype) {
      continue;
    }

    for (const registration of getMessagingRegistrations(prototype)) {
      if (!handledKinds.has(registration.kind)) {
        throw new WirestateError(
          `Service '${tokenToString(metadataToken)}' declares a messaging handler but no registered plugin handles it. ` +
            `Register the matching messaging plugin (e.g. new EventsPlugin(), new CommandsPlugin(), or new QueriesPlugin()).`,
          ERROR_CODE_VALIDATION_ERROR
        );
      }
    }
  }
}

/**
 * Resolves each distinct provider-lifecycle participant, forcing activation so `@OnActivation`
 * runs before any provision hook, and records it on the cycle.
 *
 * @remarks
 * Bindings are walked in registration order, which is what decides when each participant is
 * constructed. The participants are then returned in creation order, so provision hooks run
 * first-in and deprovision hooks last-out over the same axis. See {@link orderByCreation}.
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 * @param bindings - Bindings controlled by the provider.
 * @returns The resolved participant instances, in creation order.
 */
function resolveParticipants(
  container: Container,
  state: ProvisionState,
  bindings: ReadonlyArray<Binding>
): ReadonlyArray<object> {
  const participants: Set<object> = new Set();
  const visited: Set<ServiceToken> = new Set();

  for (const binding of bindings) {
    const token: ServiceToken = getBindingToken(binding);
    const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);

    if (
      !visited.has(token) &&
      (isProviderLifecycleParticipant(metadataToken) || isPluginParticipant(container, metadataToken))
    ) {
      visited.add(token);

      const instance: object = container.get(token) as object;

      getOrCreateCycleEntry(state, instance).participant = true;
      participants.add(instance);
    }
  }

  return orderByCreation(container, participants);
}

/**
 * Resets every active instance to in-flight (deprovision/provisionId cleared)
 * before any provision hook observes them.
 *
 * @param container - Container being provisioned.
 */
function markInFlight(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    const status: MutableWireStatus = getMutableStatus(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = null;
      status.provisionId = null;
    }
  }
}

/**
 * Runs every plugin's `onProvision` wiring for every active instance, before any user
 * `@OnProvision` (plugins bracket the user layer). Atomic: a throw unwinds the whole cycle.
 *
 * @remarks
 * An instance is recorded as wired only once every plugin accepted it. When a plugin throws
 * part-way, the dispatch already unwound the plugins that ran before it, so the instance is owed
 * no further plugin teardown, only its disposers.
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 */
function wirePlugins(container: Container, state: ProvisionState): void {
  for (const instance of container.getActiveInstances()) {
    const entry: ProvisionCycleEntry = getOrCreateCycleEntry(state, instance);

    dispatchPluginProvision(container, instance, (dispose: () => void): void => {
      entry.disposers.push(dispose);
    });

    entry.wired = true;
  }
}

/**
 * Runs each participant's `@OnProvision` hook, stamping its provision id. Atomic: a
 * throw unwinds the whole cycle.
 *
 * @remarks
 * A participant is marked provisioned before its hook runs, so a hook that throws still receives
 * the matching `@OnDeprovision` during rollback.
 *
 * @param container - Container being provisioned.
 * @param instances - Participant instances resolved this cycle.
 */
function runProvisionHooks(container: Container, instances: ReadonlyArray<object>): void {
  for (const instance of instances) {
    const status: MutableWireStatus = getMutableStatus(instance);

    // Never run @OnProvision on (or bump the provision id of) a dead instance.
    if (status.isDeactivated) {
      continue;
    }

    const methodName: Optional<string | symbol> = getProvisionHandlerMetadata(instance);
    const provisionId: ProvisionId = nextProvisionId(status);

    status.isDeprovisioned = false;
    status.provisionId = provisionId;

    if (methodName) {
      callLifecycleHandler({
        args: [provisionId],
        container,
        name: "@OnProvision",
        details: [instance.constructor.name, String(methodName)],
        instance,
        instanceName: instance.constructor.name,
        methodName,
        rethrowSync: true,
        source: "provider-provision",
        syncFailureMessage: "@OnProvision failed for",
      });
    }
  }
}

/**
 * Issues the next provision-cycle id for an instance.
 *
 * @remarks
 * Ids are per-instance and monotonic. The last issued id lives on the status so it survives the
 * `null` reset {@link markInFlight} applies at the start of every cycle, which is what keeps a
 * reprovisioned instance from reusing the id its previous cycle handed out.
 *
 * @param status - Lifecycle status of the instance entering the cycle.
 * @returns The id for this cycle.
 */
function nextProvisionId(status: MutableWireStatus): ProvisionId {
  const provisionId: ProvisionId = (status.lastProvisionId ?? 0) + 1;

  status.lastProvisionId = provisionId;

  return provisionId;
}

/**
 * Marks every remaining active instance as provisioned after all hooks have run.
 *
 * @param container - Container being provisioned.
 */
function markProvisioned(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    const status: MutableWireStatus = getMutableStatus(instance);

    if (status.isDeactivated) {
      continue;
    }

    status.isDeprovisioned = false;

    // A participant already carries the id its hook received.
    if (status.provisionId === null) {
      status.provisionId = nextProvisionId(status);
    }
  }
}

/**
 * Releases the whole cycle a container holds, whether it completed or aborted part-way.
 *
 * @remarks
 * Marks the container released first, so anything activated by a teardown hook reads as
 * deprovisioned and a bind attempted from one is not mistaken for a mid-cycle bind. The
 * transaction then owns teardown until every hook and disposer has run: `unbind`, `unbindAll`,
 * `destroy`, and `deprovision` called from inside it are no-ops.
 *
 * @param container - Container leaving provider ownership.
 * @param state - Provider lifecycle state for the container.
 */
function releaseCycle(container: Container, state: ProvisionState): void {
  state.phase = "idle";
  state.releasing = true;

  try {
    // Unwound on the axis provision ran on, so the first instance provisioned is the last one
    // deprovisioned, and a partial cycle tears down in the order it would have completed in.
    deprovisionInstances(container, state, orderByCreation(container, new Set(state.cycle.keys())));

    markActiveInstancesDeprovisioned(container);

    // Sweep any disposer registered during teardown itself, so a release never leaves a
    // subscription behind, then drop the cycle: the next provision re-tracks it.
    runRemainingDisposers(state);
    state.cycle.clear();

    // Plugins observe the cycle boundary at the very end, once.
    dispatchPluginContainerDeprovision(container);
  } finally {
    state.releasing = false;
  }
}

/**
 * Tears down what the cycle set up for the given instances, in three reverse passes.
 *
 * @remarks
 * Every `@OnDeprovision` runs first, while the buses are still live, then every plugin
 * `onDeprovision`, then every disposer. Each pass walks the instances in reverse creation order.
 * Teardown is failsafe: a throwing hook or disposer is contained and the remaining work still runs.
 *
 * @param container - Container being deprovisioned.
 * @param state - Provider lifecycle state holding the cycle.
 * @param instances - Instances to release, in creation order.
 */
function deprovisionInstances(
  container: ContainerKernel,
  state: ProvisionState,
  instances: ReadonlyArray<object>
): void {
  for (let index: number = instances.length - 1; index >= 0; index -= 1) {
    runDeprovisionHook(container, instances[index]);
  }

  for (let index: number = instances.length - 1; index >= 0; index -= 1) {
    const entry: Optional<ProvisionCycleEntry> = state.cycle.get(instances[index]);

    if (entry?.wired) {
      entry.wired = false;
      dispatchPluginDeprovision(container, instances[index]);
    }
  }

  for (let index: number = instances.length - 1; index >= 0; index -= 1) {
    const entry: Optional<ProvisionCycleEntry> = state.cycle.get(instances[index]);

    if (entry) {
      runInstanceDisposers(entry);
    }
  }
}

/**
 * Runs an instance's `@OnDeprovision` and marks it deprovisioned, when it is currently provisioned.
 *
 * @remarks
 * The hook receives the id its `@OnProvision` received, and the status keeps that id afterwards so
 * {@link WireStatus.isStale} keeps answering for work that cycle started.
 *
 * @param container - Container releasing the instance.
 * @param instance - Instance to release.
 */
function runDeprovisionHook(container: ContainerKernel, instance: object): void {
  const status: MutableWireStatus = getMutableStatus(instance);

  if (status.isDeprovisioned !== false) {
    return;
  }

  const methodName: Optional<string | symbol> = readDeprovisionHandler(container, instance);
  const provisionId: Optional<ProvisionId> = status.lastProvisionId;

  if (methodName) {
    callLifecycleHandler({
      args: provisionId === undefined ? [] : [provisionId],
      container: container as Container,
      name: "@OnDeprovision",
      details: [instance.constructor.name, String(methodName)],
      instance,
      instanceName: instance.constructor.name,
      methodName,
      rethrowSync: false,
      source: "provider-deprovision",
      syncFailureMessage: "@OnDeprovision failed for",
    });
  }

  status.isDeprovisioned = true;

  if (provisionId !== undefined) {
    status.provisionId = provisionId;
  }
}

/**
 * Reads an instance's `@OnDeprovision` method name without letting a metadata error abort teardown.
 *
 * @remarks
 * Bound classes are validated long before this point, so a throw here means an instance reached
 * the cycle by another route. It is reported like any other teardown failure and the instance is
 * treated as declaring no hook.
 *
 * @param container - Container releasing the instance.
 * @param instance - Instance to inspect.
 * @returns The decorated method name, or `undefined` when there is none or the metadata is invalid.
 */
function readDeprovisionHandler(container: ContainerKernel, instance: object): Optional<string | symbol> {
  try {
    return getDeprovisionHandlerMetadata(instance);
  } catch (error) {
    reportWirestateError({
      container: container as Container,
      error,
      instance,
      instanceName: instance.constructor.name,
      message: "@OnDeprovision metadata is invalid",
      source: "provider-deprovision",
    });

    return undefined;
  }
}

/**
 * Runs and clears the disposers an instance collected this cycle.
 *
 * @remarks
 * Disposers run in reverse registration order, so a later disposer tears down before the earlier
 * ones it may depend on. Failsafe by contract: a disposer that throws never aborts the rest. The
 * list is detached before running, so a re-entrant registration lands in a fresh list that the
 * caller's sweep reaches rather than in the one being drained.
 *
 * @param entry - Cycle entry whose disposers should run.
 */
function runInstanceDisposers(entry: ProvisionCycleEntry): void {
  const disposers: Array<() => void> = entry.disposers;

  entry.disposers = [];

  for (let index: number = disposers.length - 1; index >= 0; index -= 1) {
    try {
      disposers[index]();
    } catch {
      // Failsafe: a disposer that throws must not abort the remaining disposers.
    }
  }
}

/**
 * Runs every disposer still parked on the cycle, in reverse across instances.
 *
 * @param state - Provider lifecycle state holding the cycle.
 */
function runRemainingDisposers(state: ProvisionState): void {
  const entries: ReadonlyArray<ProvisionCycleEntry> = [...state.cycle.values()];

  for (let index: number = entries.length - 1; index >= 0; index -= 1) {
    runInstanceDisposers(entries[index]);
  }
}

/**
 * Marks every active service instance of a container as deprovisioned.
 *
 * @param container - Container leaving provider ownership.
 */
function markActiveInstancesDeprovisioned(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    getMutableStatus(instance).isDeprovisioned = true;
  }
}

/**
 * Orders instances by the container's creation order, so provider lifecycle runs first-in /
 * last-out over them.
 *
 * @remarks
 * The single ordering rule of the provider layer. Participants are resolved by walking the
 * binding list and calling `get`, which is a depth-first walk of the constructor-injection
 * graph, so the container's creation order is a topological order of it: a dependency is
 * committed before the dependent that injected it. Ordering by creation therefore runs
 * `@OnProvision` dependencies-first, and the reverse pass unwinds dependents-first - matching
 * `@OnActivation` / `@OnDeactivation`, which order on the same axis.
 *
 * Binding order is not that axis: it says only how the caller happened to write the list. Where
 * no dependency relates two participants the two orders coincide, so ordering by creation
 * changes nothing for them.
 *
 * It is a topological order for constructor injection only. A dependency first reached through
 * `inject(..., { lazy: true })`, through a `get` inside a provision hook, or from a parent
 * container is created outside this walk and is not ranked by it.
 *
 * @param container - Container that owns the instances.
 * @param instances - Instances to order.
 * @returns The instances in creation order.
 */
function orderByCreation(container: Container, instances: ReadonlySet<object>): Array<object> {
  const ordered: Array<object> = [];

  for (const instance of container.getActiveInstances()) {
    if (instances.has(instance)) {
      ordered.push(instance);
    }
  }

  // An instance the container stopped listing as active - deactivated part-way through the cycle -
  // has no creation rank left. Keep those ahead of the ranked ones, so a reverse pass still
  // unwinds them last and an unrankable instance can never be dropped from the cycle.
  if (ordered.length !== instances.size) {
    const ranked: ReadonlySet<object> = new Set(ordered);

    ordered.unshift(...[...instances].filter((instance: object): boolean => !ranked.has(instance)));
  }

  return ordered;
}

/**
 * Returns the instance's provision-cycle entry, creating an empty one on first use.
 *
 * @param state - Provider lifecycle state for the owning container.
 * @param instance - Instance the entry belongs to.
 * @returns The instance's cycle entry.
 */
function getOrCreateCycleEntry(state: ProvisionState, instance: object): ProvisionCycleEntry {
  let entry: Optional<ProvisionCycleEntry> = state.cycle.get(instance);

  if (!entry) {
    entry = { participant: false, wired: false, disposers: [] };
    state.cycle.set(instance, entry);
  }

  return entry;
}

/**
 * Resolves the constructor that can own provider lifecycle metadata.
 *
 * @param binding - Binding registered on the provider container.
 * @returns The constructor for instance descriptors, otherwise the binding token.
 */
function getProviderLifecycleMetadataToken(binding: Binding): ServiceToken {
  if (typeof binding !== "function" && binding.type === BindingType.Instance && typeof binding.value === "function") {
    return binding.value as ServiceToken;
  }

  return getBindingToken(binding);
}

/**
 * Returns the prototype lifecycle metadata is read from, when the token is a class.
 *
 * @param token - Binding token to inspect.
 * @returns The class prototype, or `undefined` for a non-class token.
 */
function getLifecyclePrototype(token: ServiceToken): Optional<object> {
  return typeof token === "function" ? (token.prototype as Optional<object>) : undefined;
}

/**
 * Checks whether a token names a class declaring `@OnProvision` or `@OnDeprovision`.
 *
 * @remarks
 * Both hooks are read, not short-circuited, so a hierarchy conflict in either surfaces at
 * validation time rather than during teardown.
 *
 * @param token - Binding token to inspect.
 * @returns True when the token is a class with a provider lifecycle hook.
 */
function isProviderLifecycleParticipant(token: ServiceToken): boolean {
  const prototype: Optional<object> = getLifecyclePrototype(token);

  if (!prototype) {
    return false;
  }

  const provision: Optional<string | symbol> = getProvisionHandlerMetadata(prototype);
  const deprovision: Optional<string | symbol> = getDeprovisionHandlerMetadata(prototype);

  return provision !== undefined || deprovision !== undefined;
}
