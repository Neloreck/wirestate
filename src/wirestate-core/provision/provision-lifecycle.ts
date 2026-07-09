import {
  type InstanceRecord,
  type ProvisionId,
  getInstanceContainer,
  getInstanceRecord,
  WireStatus,
} from "../activation/wire-status";
import { type Binding, type ServiceToken, BindingType } from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import type { Container } from "../container/container";
import { callLifecycleHandler } from "../container/container-call-lifecycle-handler";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
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
import { type Maybe, type Nullable, type Optional } from "../types/general";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";
import { type CycleEntry, type ProvisionState, getOrCreateProvisionState, getProvisionState } from "./provision-state";

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * Resolves lifecycle participants and calls `@OnProvision` once for this
 * provision cycle. It also updates instance lifecycle status so
 * {@link WireStatus} reflects provider ownership.
 *
 * A container is provisioned by at most one provider at a time. Provisioning a
 * container that is already provisioned throws. Deprovision it first.
 *
 * @group Container
 * @internal
 *
 * @param container - Container entering provider ownership.
 * @param bindings - Bindings controlled by the provider.
 *
 * @throws {@link WirestateError} If the container is already provisioned.
 */
export function provisionContainer(
  container: Container,
  bindings: ReadonlyArray<Binding> = container.getOwnBindings()
): void {
  const state: ProvisionState = getOrCreateProvisionState(container);

  if (state.status === true) {
    throw new WirestateError(
      "Container is already provisioned. Deprovision it before provisioning it again.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  state.status = undefined;
  state.provisioning = true;

  try {
    state.instances = provisionInstances(container, state, bindings);
    state.status = true;
  } finally {
    state.provisioning = false;
  }
}

/**
 * Deprovisions a container for a framework provider.
 *
 * @remarks
 * Idempotent: a second deprovision of an already deprovisioned (or never
 * provisioned) container is a no-op.
 *
 * @group Container
 * @internal
 *
 * @param container - Container leaving provider ownership.
 */
export function deprovisionContainer(container: Container): void {
  const state: Optional<ProvisionState> = getProvisionState(container);

  if (!state) {
    return;
  }

  const wasProvisioned: boolean = state.status === true;

  state.status = false;

  const instances: Nullable<Array<object>> = state.instances;

  if (instances) {
    deprovisionInstances(container, state, instances);

    markActiveInstancesDeprovisioned(container);

    for (const instance of instances) {
      state.cycleByInstance.delete(instance);
    }

    state.instances = null;
  } else if (wasProvisioned) {
    // Unbinding the last lifecycle binding already cleared the instances entry,
    // but the container itself is only leaving provider ownership now.
    markActiveInstancesDeprovisioned(container);
  }

  // Plugins observe the cycle boundary at the very end, once, when the container was provisioned.
  if (instances || wasProvisioned) {
    dispatchPluginContainerDeprovision(container);
  }
}

/**
 * Marks every active service instance of a container as deprovisioned.
 *
 * @param container - Container leaving provider ownership.
 */
function markActiveInstancesDeprovisioned(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    status.isDeprovisioned = true;
  }
}

/**
 * Deprovisions any provider lifecycle instance represented by a binding token.
 *
 * @group Container
 * @internal
 *
 * @param container - Container losing the binding.
 * @param token - Binding token removed from the container.
 */
export function deprovisionContainerBinding(container: Container, token: ServiceToken): void {
  const state: Optional<ProvisionState> = getProvisionState(container);
  const instances: Maybe<Array<object>> = state?.instances;

  if (!state || !instances) {
    return;
  }

  const removed: Array<object> = [];
  const remaining: Array<object> = [];

  for (const instance of instances) {
    if (isInstanceProvisionedForToken(state, instance, token)) {
      removed.push(instance);
    } else {
      remaining.push(instance);
    }
  }

  if (removed.length === 0) {
    return;
  }

  deprovisionInstances(container, state, removed);
  untrackProvisionToken(state, removed, token);

  state.instances = remaining.length > 0 ? remaining : null;
}

/**
 * Resolves provider lifecycle participants and calls provision hooks.
 *
 * @group Container
 * @internal
 *
 * @param container - Container that owns the bindings.
 * @param state - Provider lifecycle state for the container.
 * @param bindings - Bindings controlled by the provider.
 * @returns Instances that were resolved for provider lifecycle management.
 */
export function provisionInstances(
  container: Container,
  state: ProvisionState,
  bindings: ReadonlyArray<Binding>
): Array<object> {
  // Plugins observe the provision cycle boundary before any instance wiring.
  dispatchPluginContainerProvision(container);

  validateBindings(container, bindings);

  const { instances, trackedTokens } = resolveParticipants(container, state, bindings);

  markInFlight(container);
  wirePlugins(container, state, instances, trackedTokens);
  runProvisionHooks(container, state, instances, trackedTokens);
  markProvisioned(container);

  return instances;
}

/**
 * Validates the bindings before provisioning: a provider-lifecycle participant must
 * be bound on this container, and every declared messaging handler must have a
 * registered plugin that handles its kind. Two passes, ordered so the ownership
 * error wins over the unhandled-kind error.
 *
 * @internal
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

    if (typeof metadataToken !== "function" || !metadataToken.prototype) {
      continue;
    }

    for (const registration of getMessagingRegistrations(metadataToken.prototype as object)) {
      if (!handledKinds.has(registration.kind)) {
        throw new WirestateError(
          `Service '${metadataToken.name}' declares a messaging handler but no registered plugin handles it. ` +
            `Register the matching messaging plugin (e.g. new EventsPlugin(), new CommandsPlugin(), or new QueriesPlugin()).`,
          ERROR_CODE_VALIDATION_ERROR
        );
      }
    }
  }
}

/**
 * Resolves each distinct provider-lifecycle participant, forcing activation so
 * `@OnActivation` runs before any provision hook, and tracks the token that
 * provisioned it.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 * @param bindings - Bindings controlled by the provider.
 * @returns The resolved participant instances and the instance/token pairs tracked this cycle.
 */
function resolveParticipants(
  container: Container,
  state: ProvisionState,
  bindings: ReadonlyArray<Binding>
): { instances: Array<object>; trackedTokens: Array<readonly [object, ServiceToken]> } {
  const instances: Array<object> = [];
  const trackedTokens: Array<readonly [object, ServiceToken]> = [];
  const visited: Set<ServiceToken> = new Set();

  for (const binding of bindings) {
    const token: ServiceToken = getBindingToken(binding);
    const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);

    if (
      !visited.has(token) &&
      (isProviderLifecycleParticipant(metadataToken) || isPluginParticipant(container, token))
    ) {
      visited.add(token);

      const instance: object = container.get(token) as object;

      trackProvisionToken(state, instance, token);
      trackedTokens.push([instance, token]);
      instances.push(instance);
    }
  }

  return { instances, trackedTokens };
}

/**
 * Resets every active instance to in-flight (deprovision/provisionId cleared)
 * before any provision hook observes them.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 */
function markInFlight(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = null;
      status.provisionId = null;
    }
  }
}

/**
 * Runs every plugin's `onProvision` wiring for every active instance, before any
 * user `@OnProvision` (plugins bracket the user layer). Atomic: a throw unwinds the
 * whole cycle.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 * @param instances - Participant instances resolved this cycle.
 * @param trackedTokens - Instance/token pairs tracked this cycle (for rollback).
 */
function wirePlugins(
  container: Container,
  state: ProvisionState,
  instances: ReadonlyArray<object>,
  trackedTokens: ReadonlyArray<readonly [object, ServiceToken]>
): void {
  for (const instance of container.getActiveInstances()) {
    try {
      dispatchPluginProvision(container, instance, (dispose: () => void): void =>
        appendDisposer(state, instance, dispose)
      );
    } catch (error) {
      rollbackProvision(container, state, instances, trackedTokens);

      throw error;
    }
  }
}

/**
 * Runs each participant's `@OnProvision` hook, stamping its provision id. Atomic: a
 * throw unwinds the whole cycle.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 * @param instances - Participant instances resolved this cycle.
 * @param trackedTokens - Instance/token pairs tracked this cycle (for rollback).
 */
function runProvisionHooks(
  container: Container,
  state: ProvisionState,
  instances: ReadonlyArray<object>,
  trackedTokens: ReadonlyArray<readonly [object, ServiceToken]>
): void {
  for (const instance of instances) {
    const status: WireStatus = WireStatus.for(instance);

    // Never run @OnProvision on (or bump the provision id of) a dead instance.
    if (status.isDeactivated) {
      continue;
    }

    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(instance);
    const record: InstanceRecord = getInstanceRecord(status);
    const provisionId: ProvisionId = (record.provisionIdCounter ?? 0) + 1;

    record.provisionIdCounter = provisionId;

    status.isDeprovisioned = false;
    status.provisionId = provisionId;

    try {
      if (methodName) {
        callLifecycleHandler({
          args: [provisionId],
          container: getInstanceContainer(instance),
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
    } catch (error) {
      rollbackProvision(container, state, instances, trackedTokens);

      throw error;
    }
  }
}

/**
 * Marks every remaining active instance as provisioned after all hooks have run.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 */
function markProvisioned(container: Container): void {
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = false;
    }
  }
}

/**
 * Runs deprovision hooks then unsubscribes messaging handlers for provisioned instances.
 *
 * @remarks
 * Two phases: every `@OnDeprovision` runs first (reverse provision
 * order, buses still live), then every handler is failsafe-unsubscribed.
 *
 * @group Container
 * @internal
 *
 * @param container - Container being deprovisioned (for plugin dispatch).
 * @param state - Provider lifecycle state holding the cycle's messaging disposers.
 * @param instances - Instances resolved during provider provisioning.
 */
export function deprovisionInstances(
  container: Container,
  state: ProvisionState,
  instances: ReadonlyArray<object>
): void {
  // User @OnDeprovision first (buses still live), then plugin teardown (reverse,
  // failsafe), then unsubscribe every handler.
  const deprovisioned: ReadonlyArray<object> = runDeprovisionHooks(instances);

  for (const instance of deprovisioned) {
    dispatchPluginDeprovision(container, instance);
  }

  for (const instance of instances) {
    unsubscribeInstance(state, instance);
  }
}

/**
 * Runs `@OnDeprovision` for every currently-provisioned instance in reverse
 * provision order, while buses are still live.
 *
 * @internal
 *
 * @param instances - Instances resolved during provider provisioning.
 * @returns The instances that were deprovisioned, in reverse provision order.
 */
function runDeprovisionHooks(instances: ReadonlyArray<object>): ReadonlyArray<object> {
  const deprovisioned: Array<object> = [];

  for (let index: number = instances.length - 1; index >= 0; index -= 1) {
    const instance: object = instances[index];
    const status: WireStatus = WireStatus.for(instance);

    // Only deprovision instances that are currently provisioned.
    if (status.isDeprovisioned !== false) {
      continue;
    }

    const methodName: Maybe<string | symbol> = getDeprovisionHandlerMetadata(instance);
    const provisionId: Optional<ProvisionId> = getInstanceRecord(status).provisionIdCounter;

    if (methodName) {
      callLifecycleHandler({
        args: provisionId === undefined ? [] : [provisionId],
        container: getInstanceContainer(instance),
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

    deprovisioned.push(instance);
  }

  return deprovisioned;
}

/**
 * Runs and clears the provision-cycle messaging disposers for one instance.
 *
 * @remarks
 * Failsafe by contract: a disposer that throws never aborts
 * deprovision, so nested-provider teardown ordering can never error. No-op when
 * the instance subscribed nothing this cycle.
 *
 * @internal
 *
 * @param state - Provider lifecycle state holding the cycle's disposers.
 * @param instance - Instance whose handlers should be unsubscribed.
 */
function unsubscribeInstance(state: ProvisionState, instance: object): void {
  const entry: Optional<CycleEntry> = state.cycleByInstance.get(instance);

  if (!entry || entry.disposers.length === 0) {
    return;
  }

  // Detach before running so a re-entrant teardown cannot see or re-run them.
  const disposers: Array<() => void> = entry.disposers;

  entry.disposers = [];

  for (const dispose of disposers) {
    try {
      dispose();
    } catch {
      // Failsafe: a disposer that throws must not abort the remaining disposers.
    }
  }
}

/**
 * Unwinds a partially provisioned cycle after a subscribe or `@OnProvision` failure.
 *
 * @remarks
 * Atomic provision: runs `@OnDeprovision` for instances that reached
 * the hook, failsafe-unsubscribes every handler wired this cycle, marks active
 * instances deprovisioned, and untracks the cycle's tokens.
 *
 * @internal
 *
 * @param container - Container being provisioned.
 * @param state - Provider lifecycle state for the container.
 * @param instances - All participant instances resolved this cycle.
 * @param trackedTokens - Instance/token pairs tracked this cycle.
 */
function rollbackProvision(
  container: Container,
  state: ProvisionState,
  instances: ReadonlyArray<object>,
  trackedTokens: ReadonlyArray<readonly [object, ServiceToken]>
): void {
  state.status = false;

  deprovisionInstances(container, state, instances);

  // Sweep any disposers a plugin parked on a non-participant instance this cycle,
  // so an aborted provision never leaks a subscription.
  clearRemainingDisposers(state);

  for (const activeInstance of container.getActiveInstances()) {
    WireStatus.for(activeInstance).isDeprovisioned = true;
  }

  for (const [trackedInstance, token] of trackedTokens) {
    untrackProvisionToken(state, [trackedInstance], token);
  }

  dispatchPluginContainerDeprovision(container);
}

/**
 * Appends a teardown callback for an instance to the current provision cycle.
 *
 * @internal
 *
 * @param state - Provider lifecycle state holding the cycle's disposers.
 * @param instance - Instance the disposer belongs to.
 * @param dispose - Teardown callback to run (reverse order, failsafe) at deprovision.
 */
function appendDisposer(state: ProvisionState, instance: object, dispose: () => void): void {
  getOrCreateCycleEntry(state, instance).disposers.push(dispose);
}

/**
 * Failsafe-runs and clears every remaining disposer in the cycle.
 *
 * @internal
 *
 * @param state - Provider lifecycle state holding the cycle's disposers.
 */
function clearRemainingDisposers(state: ProvisionState): void {
  for (const instance of [...state.cycleByInstance.keys()]) {
    unsubscribeInstance(state, instance);
  }
}

/**
 * Tracks which binding token caused an instance to enter provider lifecycle state.
 *
 * @internal
 *
 * @param state - Provider lifecycle state for the owning container.
 * @param instance - Provisioned instance.
 * @param token - Binding token used to resolve the instance.
 */
function trackProvisionToken(state: ProvisionState, instance: object, token: ServiceToken): void {
  getOrCreateCycleEntry(state, instance).tokens.add(token);
}

/**
 * Returns the instance's provision-cycle entry, creating an empty one on first use.
 *
 * @internal
 *
 * @param state - Provider lifecycle state for the owning container.
 * @param instance - Instance the entry belongs to.
 * @returns The instance's cycle entry.
 */
function getOrCreateCycleEntry(state: ProvisionState, instance: object): CycleEntry {
  let entry: Optional<CycleEntry> = state.cycleByInstance.get(instance);

  if (!entry) {
    entry = { tokens: new Set(), disposers: [] };
    state.cycleByInstance.set(instance, entry);
  }

  return entry;
}

/**
 * Removes one provider lifecycle token from instances.
 *
 * @internal
 *
 * @param state - Provider lifecycle state for the owning container.
 * @param instances - Instances losing a lifecycle token.
 * @param token - Binding token to remove.
 */
function untrackProvisionToken(state: ProvisionState, instances: ReadonlyArray<object>, token: ServiceToken): void {
  for (const instance of instances) {
    const entry: Optional<CycleEntry> = state.cycleByInstance.get(instance);

    if (!entry) {
      continue;
    }

    entry.tokens.delete(token);

    if (entry.tokens.size === 0) {
      state.cycleByInstance.delete(instance);
    }
  }
}

/**
 * Checks whether an instance lifecycle entry belongs to a binding token.
 *
 * @internal
 *
 * @param state - Provider lifecycle state for the owning container.
 * @param instance - Provisioned instance.
 * @param token - Binding token to inspect.
 * @returns True when the instance was provisioned for the token.
 */
function isInstanceProvisionedForToken(state: ProvisionState, instance: object, token: ServiceToken): boolean {
  return state.cycleByInstance.get(instance)?.tokens.has(token) ?? false;
}

/**
 * Resolves the constructor that can own provider lifecycle metadata.
 *
 * @internal
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
 * Checks whether an instance token should participate in provider lifecycle state.
 *
 * @internal
 *
 * @param token - Binding token to inspect.
 * @returns True when the token is an instance constructor with provider lifecycle metadata.
 */
function isProviderLifecycleParticipant(token: ServiceToken): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const prototype: Optional<object> = token.prototype as Optional<object>;

  return prototype
    ? Boolean(getProvisionHandlerMetadata(prototype) || getDeprovisionHandlerMetadata(prototype))
    : false;
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
export function assertBindableWhileProvisioned(container: Container, binding: Binding): void {
  const state: Optional<ProvisionState> = getProvisionState(container);

  // Fire while the container is provisioned AND during a live provision cycle.
  if (!state || (state.status !== true && !state.provisioning)) {
    return;
  }

  const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);
  const prototype: Optional<object> =
    typeof metadataToken === "function" ? (metadataToken.prototype as Optional<object>) : undefined;
  const declaresMessaging: boolean = prototype !== undefined && getMessagingRegistrations(prototype).length > 0;

  if (declaresMessaging || isProviderLifecycleParticipant(metadataToken)) {
    const name: string = typeof metadataToken === "function" ? metadataToken.name : String(metadataToken);

    throw new WirestateError(
      `Cannot bind '${name}' while the container is provisioned or provisioning: its messaging or ` +
        `provider-lifecycle handlers would not wire until the next provision cycle. Bind it before ` +
        `provisioning, or deprovision and reprovision the container.`,
      ERROR_CODE_VALIDATION_ERROR
    );
  }
}
