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
import type { Maybe } from "../types/general";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";
import {
  clearContainerProvisionStatus,
  ContainerProvisionLifecycle,
  getContainerProvisionStatus,
  PROVISION_IDS_BY_INSTANCE,
  PROVISION_LIFECYCLES_BY_CONTAINER,
  PROVISION_TOKENS_BY_INSTANCE,
  setContainerProvisioned,
  UNBIND_INTERCEPTOR_REMOVERS,
} from "./provision-state";

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * Resolves lifecycle participants and calls `@OnProvision` once for this
 * provision cycle. It also updates instance lifecycle status so
 * {@link WireStatus} reflects provider ownership.
 *
 * @group Container
 *
 * @param container - Container entering provider ownership.
 * @param lifecycle - Provider lifecycle state.
 * @param bindings - Bindings controlled by the provider.
 *
 * @example
 * ```typescript
 * import { Injectable, OnProvision, Container, provisionContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnProvision()
 *   public connect(): void {}
 * }
 *
 * const container = new Container({ bindings: [PanelService] });
 * const lifecycle = new Map();
 *
 * provisionContainer(container, lifecycle);
 * ```
 */
export function provisionContainer(
  container: Container,
  lifecycle: ContainerProvisionLifecycle,
  bindings: Bindings = container.getOwnBindings()
): void {
  if (lifecycle.has(container)) {
    return;
  }

  dbg.info(prefix(__filename), "Provisioning container:", { container });

  clearContainerProvisionStatus(container);

  lifecycle.set(container, provisionInstances(container, bindings));
  trackProvisionLifecycle(container, lifecycle);

  setContainerProvisioned(container, true);
}

/**
 * Deprovisions a container for a framework provider.
 *
 * @group Container
 *
 * @param container - Container leaving provider ownership.
 * @param lifecycle - Provider lifecycle state.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeprovision, Container, deprovisionContainer, provisionContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnDeprovision()
 *   public disconnect(): void {}
 * }
 *
 * const container = new Container({ bindings: [PanelService] });
 * const lifecycle = new Map();
 *
 * provisionContainer(container, lifecycle, [PanelService]);
 * deprovisionContainer(container, lifecycle);
 * ```
 */
export function deprovisionContainer(container: Container, lifecycle: ContainerProvisionLifecycle): void {
  const wasProvisioned: boolean = getContainerProvisionStatus(container) === true;

  setContainerProvisioned(container, false);

  const instances: Maybe<Array<object>> = lifecycle.get(container);

  if (instances) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      instances,
    });

    deprovisionInstances(instances);

    markActiveInstancesDeprovisioned(container);

    for (const instance of instances) {
      PROVISION_TOKENS_BY_INSTANCE.delete(instance);
    }

    lifecycle.delete(container);

    untrackProvisionLifecycle(container, lifecycle);
  } else if (wasProvisioned) {
    // Unbinding the last lifecycle binding already removed the lifecycle entry,
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
  const lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (!lifecycles) {
    return;
  }

  for (const lifecycle of Array.from(lifecycles)) {
    const instances: Maybe<Array<object>> = lifecycle.get(container);

    if (!instances) {
      continue;
    }

    const removed: Array<object> = [];
    const remaining: Array<object> = [];

    for (const instance of instances) {
      if (isInstanceProvisionedForToken(instance, token)) {
        removed.push(instance);
      } else {
        remaining.push(instance);
      }
    }

    if (removed.length === 0) {
      continue;
    }

    deprovisionInstances(removed);
    untrackProvisionToken(removed, token);

    if (remaining.length > 0) {
      lifecycle.set(container, remaining);
    } else {
      lifecycle.delete(container);
      untrackProvisionLifecycle(container, lifecycle);
    }
  }
}

/**
 * Deprovisions all provider lifecycle instances owned by a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container leaving provider ownership.
 */
export function deprovisionContainerBindings(container: Container): void {
  const lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (!lifecycles) {
    return;
  }

  for (const lifecycle of Array.from(lifecycles)) {
    deprovisionContainer(container, lifecycle);
  }
}

/**
 * Resolves provider lifecycle participants and calls provision hooks.
 *
 * @group Container
 *
 * @param container - Container that owns the bindings.
 * @param bindings - Bindings controlled by the provider.
 * @returns Instances that were resolved for provider lifecycle management.
 *
 * @internal
 */
export function provisionInstances(container: Container, bindings: Bindings = []): Array<object> {
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

      trackProvisionToken(instance, token);
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

  // Phase 3: provision each participant and run its @OnProvision hook.
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
      const reachedInstances: Array<object> = instances.slice(0, index + 1);

      setContainerProvisioned(container, false);

      deprovisionInstances(reachedInstances);

      for (const activeInstance of container.getActiveInstances()) {
        const activeStatus: WireStatus = WireStatus.for(activeInstance);

        activeStatus.isDeprovisioned = true;
      }

      for (const [instance, token] of trackedTokens) {
        untrackProvisionToken([instance], token);
      }

      throw error;
    }
  }

  // Phase 4: mark remaining active non-participants as provisioned.
  for (const instance of container.getActiveInstances()) {
    const status: WireStatus = WireStatus.for(instance);

    if (!status.isDeactivated) {
      status.isDeprovisioned = false;
    }
  }

  return instances;
}

/**
 * Calls deprovision hooks for provisioned instances.
 *
 * @group Container
 * @internal
 *
 * @param instances - Instances resolved during provider provisioning.
 */
export function deprovisionInstances(instances: ReadonlyArray<object>): void {
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
}

/**
 * Tracks a provider lifecycle map that currently owns a container.
 *
 * @remarks
 * Also registers an unbind interceptor on the container, so raw
 * `container.unbind`/`container.unbindAll` calls deprovision owned instances
 * before binding deactivation.
 *
 * @internal
 *
 * @param container - Provisioned container.
 * @param lifecycle - Provider lifecycle state.
 */
function trackProvisionLifecycle(container: Container, lifecycle: ContainerProvisionLifecycle): void {
  let lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (!lifecycles) {
    lifecycles = new Set();
    PROVISION_LIFECYCLES_BY_CONTAINER.set(container, lifecycles);
  }

  lifecycles.add(lifecycle);

  let removers: Maybe<Map<ContainerProvisionLifecycle, () => void>> = UNBIND_INTERCEPTOR_REMOVERS.get(container);

  if (!removers) {
    removers = new Map();
    UNBIND_INTERCEPTOR_REMOVERS.set(container, removers);
  }

  if (!removers.has(lifecycle)) {
    removers.set(
      lifecycle,
      container.addUnbindInterceptor({
        onUnbind: (token) => {
          if (container.hasOwn(token)) {
            deprovisionContainerBinding(container, token);
          }
        },
        onUnbindAll: () => deprovisionContainerBindings(container),
      })
    );
  }
}

/**
 * Removes a provider lifecycle map from a container, together with the unbind
 * interceptor registered when the lifecycle took ownership.
 *
 * @internal
 *
 * @param container - Deprovisioned container.
 * @param lifecycle - Provider lifecycle state.
 */
function untrackProvisionLifecycle(container: Container, lifecycle: ContainerProvisionLifecycle): void {
  const lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (lifecycles) {
    lifecycles.delete(lifecycle);

    if (lifecycles.size === 0) {
      PROVISION_LIFECYCLES_BY_CONTAINER.delete(container);
    }
  }

  const removers: Maybe<Map<ContainerProvisionLifecycle, () => void>> = UNBIND_INTERCEPTOR_REMOVERS.get(container);
  const remove: Maybe<() => void> = removers?.get(lifecycle);

  if (removers && remove) {
    remove();
    removers.delete(lifecycle);

    if (removers.size === 0) {
      UNBIND_INTERCEPTOR_REMOVERS.delete(container);
    }
  }
}

/**
 * Tracks which binding token caused an instance to enter provider lifecycle state.
 *
 * @internal
 *
 * @param instance - Provisioned instance.
 * @param token - Binding token used to resolve the instance.
 */
function trackProvisionToken(instance: object, token: ServiceToken): void {
  let tokens: Maybe<Set<ServiceToken>> = PROVISION_TOKENS_BY_INSTANCE.get(instance);

  if (!tokens) {
    tokens = new Set();
    PROVISION_TOKENS_BY_INSTANCE.set(instance, tokens);
  }

  tokens.add(token);
}

/**
 * Removes one provider lifecycle token from instances.
 *
 * @internal
 *
 * @param instances - Instances losing a lifecycle token.
 * @param token - Binding token to remove.
 */
function untrackProvisionToken(instances: ReadonlyArray<object>, token: ServiceToken): void {
  for (const instance of instances) {
    const tokens: Maybe<Set<ServiceToken>> = PROVISION_TOKENS_BY_INSTANCE.get(instance);

    if (!tokens) {
      continue;
    }

    tokens.delete(token);

    if (tokens.size === 0) {
      PROVISION_TOKENS_BY_INSTANCE.delete(instance);
    }
  }
}

/**
 * Checks whether an instance lifecycle entry belongs to a binding token.
 *
 * @internal
 *
 * @param instance - Provisioned instance.
 * @param token - Binding token to inspect.
 * @returns True when the instance was provisioned for the token.
 */
function isInstanceProvisionedForToken(instance: object, token: ServiceToken): boolean {
  return PROVISION_TOKENS_BY_INSTANCE.get(instance)?.has(token) ?? false;
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
    ? Boolean(getProvisionHandlerMetadata(prototype) || getDeprovisionHandlerMetadata(prototype))
    : false;
}
