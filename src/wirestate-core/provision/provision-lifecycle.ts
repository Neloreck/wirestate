import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { getInstanceContainer } from "../activation/activation-lifecycle";
import { ProvisionId, WireStatus } from "../activation/wire-status";
import { Binding, Bindings, BindingType, ServiceToken } from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import type { Container } from "../container/container";
import { callLifecycleHandler } from "../container/container-call-lifecycle-handler";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { registerMessagingHandlers } from "../messaging/messaging-activation";
import { getMessagingRegistrations } from "../messaging/messaging-registration";
import type { Maybe } from "../types/general";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";
import {
  getOrCreateProvisionState,
  getProvisionState,
  PROVISION_IDS_BY_INSTANCE,
  ProvisionState,
} from "./provision-state";

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * Resolves lifecycle participants and calls `@OnProvision` once for this
 * provision cycle. It also updates instance lifecycle status so
 * {@link WireStatus} reflects provider ownership.
 *
 * A container is provisioned by at most one provider at a time. Provisioning a
 * container that is already provisioned throws; deprovision it first.
 *
 * @group Container
 * @internal
 *
 * @param container - Container entering provider ownership.
 * @param bindings - Bindings controlled by the provider.
 *
 * @throws {@link WirestateError} If the container is already provisioned.
 */
export function provisionContainer(container: Container, bindings: Bindings = container.getOwnBindings()): void {
  const state: ProvisionState = getOrCreateProvisionState(container);

  if (state.status === true) {
    throw new WirestateError(
      "Container is already provisioned. Deprovision it before provisioning it again.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  dbg.info(prefix(__filename), "Provisioning container:", { container });

  state.status = undefined;
  state.instances = provisionInstances(container, state, bindings);
  state.status = true;
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
  const state: Maybe<ProvisionState> = getProvisionState(container);

  if (!state) {
    return;
  }

  const wasProvisioned: boolean = state.status === true;

  state.status = false;

  const instances: Maybe<Array<object>> = state.instances;

  if (instances) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      instances,
    });

    deprovisionInstances(instances, state);

    markActiveInstancesDeprovisioned(container);

    for (const instance of instances) {
      state.tokensByInstance.delete(instance);
    }

    state.instances = null;
  } else if (wasProvisioned) {
    // Unbinding the last lifecycle binding already cleared the instances entry,
    // but the container itself is only leaving provider ownership now.
    markActiveInstancesDeprovisioned(container);
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
  const state: Maybe<ProvisionState> = getProvisionState(container);
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

  deprovisionInstances(removed, state);
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
  bindings: Bindings = []
): Array<object> {
  const instances: Array<object> = [];
  const trackedTokens: Array<readonly [object, ServiceToken]> = [];
  const visited: Set<ServiceToken> = new Set();

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

  // Phase 1: resolve each distinct participant so @OnActivated runs before hooks.
  for (const binding of bindings) {
    const token: ServiceToken = getBindingToken(binding);
    const metadataToken: ServiceToken = getProviderLifecycleMetadataToken(binding);

    if (!visited.has(token) && isProviderLifecycleParticipant(metadataToken)) {
      visited.add(token);

      const instance: object = container.get(token) as object;

      trackProvisionToken(state, instance, token);
      trackedTokens.push([instance, token]);
      instances.push(instance);
    }
  }

  // Phase 2: reset active instances to in-flight markers before any hook runs.
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = null;
      status.provisionId = null;
    }
  }

  // Phase 3: subscribe every messaging handler before any @OnProvision runs, so
  // cross-service emit/execute/query inside provision hooks is reliable
  // regardless of binding order. Subscription is atomic: any failure
  // unwinds the whole cycle, including handlers wired earlier this pass.
  for (let index: number = 0; index < instances.length; index += 1) {
    const instance: object = instances[index];
    const disposers: Array<() => void> = [];

    try {
      registerMessagingHandlers(container, instance, disposers);
    } catch (error) {
      // Park whatever was wired before the throw so rollback can tear it down.
      if (disposers.length > 0) {
        state.disposers.set(instance, disposers);
      }

      rollbackProvision(container, state, instances, trackedTokens);

      throw error;
    }

    if (disposers.length > 0) {
      state.disposers.set(instance, disposers);
    }
  }

  // Phase 4: provision each participant and run its @OnProvision hook.
  for (let index: number = 0; index < instances.length; index += 1) {
    const instance: object = instances[index];
    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(instance);
    const provisionId: ProvisionId = (PROVISION_IDS_BY_INSTANCE.get(instance) ?? 0) + 1;
    const status: WireStatus = WireStatus.for(instance);

    PROVISION_IDS_BY_INSTANCE.set(instance, provisionId);

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

  // Phase 5: mark remaining active non-participants as provisioned.
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = false;
    }
  }

  return instances;
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
 * @param instances - Instances resolved during provider provisioning.
 * @param state - Provider lifecycle state holding the cycle's messaging disposers.
 */
export function deprovisionInstances(instances: ReadonlyArray<object>, state: ProvisionState): void {
  // Phase 1: run every @OnDeprovision (reverse provision order) while buses are
  // still live, so a "shutting down" emit in a deprovision hook still reaches handlers.
  for (let index: number = instances.length - 1; index >= 0; index -= 1) {
    const instance: object = instances[index];
    const status: WireStatus = WireStatus.for(instance);

    // Only deprovision instances that are currently provisioned.
    if (status.isDeprovisioned !== false) {
      continue;
    }

    const methodName: Maybe<string | symbol> = getDeprovisionHandlerMetadata(instance);
    const provisionId: Maybe<ProvisionId> = PROVISION_IDS_BY_INSTANCE.get(instance);

    if (methodName) {
      callLifecycleHandler({
        args: provisionId === undefined ? [] : [provisionId],
        container: getInstanceContainer(instance),
        name: "@OnDeprovision",
        details: [instance.constructor.name, String(methodName)],
        instance,
        instanceName: instance.constructor.name,
        methodName,
        source: "provider-deprovision",
        syncFailureMessage: "@OnDeprovision failed for",
      });
    }

    status.isDeprovisioned = true;

    if (provisionId !== undefined) {
      status.provisionId = provisionId;
    }
  }

  // Phase 2: unsubscribe messaging handlers after every @OnDeprovision has run.
  for (const instance of instances) {
    unsubscribeInstance(state, instance);
  }
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
  const disposers: Maybe<Array<() => void>> = state.disposers.get(instance);

  if (!disposers) {
    return;
  }

  state.disposers.delete(instance);

  for (const dispose of disposers) {
    try {
      dispose();
    } catch (error) {
      dbg.error(prefix(__filename), "Messaging unsubscribe threw during deprovision (ignored):", { error });
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

  deprovisionInstances(instances, state);

  for (const activeInstance of container.getActiveInstances()) {
    WireStatus.for(activeInstance).isDeprovisioned = true;
  }

  for (const [trackedInstance, token] of trackedTokens) {
    untrackProvisionToken(state, [trackedInstance], token);
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
  let tokens: Maybe<Set<ServiceToken>> = state.tokensByInstance.get(instance);

  if (!tokens) {
    tokens = new Set();
    state.tokensByInstance.set(instance, tokens);
  }

  tokens.add(token);
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
    const tokens: Maybe<Set<ServiceToken>> = state.tokensByInstance.get(instance);

    if (!tokens) {
      continue;
    }

    tokens.delete(token);

    if (tokens.size === 0) {
      state.tokensByInstance.delete(instance);
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
  return state.tokensByInstance.get(instance)?.has(token) ?? false;
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

  const prototype: Maybe<object> = token.prototype as Maybe<object>;

  return prototype
    ? Boolean(
        getProvisionHandlerMetadata(prototype) ||
        getDeprovisionHandlerMetadata(prototype) ||
        getMessagingRegistrations(prototype).length
      )
    : false;
}
