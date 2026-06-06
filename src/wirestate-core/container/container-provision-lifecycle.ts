import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, Identifier } from "../alias";
import { hasScopeInjection } from "../bind/instance/instance-scopes";
import { getDeprovisionHandlerMetadata } from "../bind/instance/on-deprovision";
import { getProvisionHandlerMetadata } from "../bind/instance/on-provision";
import { getBindingToken } from "../bind/utils/get-binding-token";
import { getContainerBindings } from "../bind/utils/register-binding";
import { callLifecycleHandler } from "../lifecycle/call-lifecycle-handler";
import {
  CONTAINER_REFS_BY_INSTANCE,
  PROVISION_IDS_BY_INSTANCE,
  PROVISION_LIFECYCLES_BY_CONTAINER,
  PROVISION_TOKENS_BY_INSTANCE,
  SCOPES_BY_INSTANCE,
} from "../registry";
import { Maybe, Optional } from "../types/general";
import { Binding, Bindings, ProvisionId } from "../types/provision";

/**
 * Represents provider lifecycle state keyed by container.
 *
 * Framework adapters keep one map per provider tree.
 *
 * @group Container
 */
export type ContainerProvisionLifecycle = Map<Container, Array<object>>;

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * Resolves lifecycle participants and calls `@OnProvision` once for this
 * provision cycle. It also tracks injected `WireScope` instances so
 * `scope.isDeprovisioned` matches provider ownership.
 *
 * @group Container
 *
 * @param container - Container entering provider ownership.
 * @param lifecycle - Provider lifecycle state.
 * @param bindings - Bindings controlled by the provider.
 *
 * @example
 * ```typescript
 * import { Injectable, OnProvision, createContainer, provisionContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnProvision()
 *   public connect(): void {}
 * }
 *
 * const container = createContainer({ bindings: [PanelService] });
 * const lifecycle = new Map();
 *
 * provisionContainer(container, lifecycle);
 * ```
 */
export function provisionContainer(
  container: Container,
  lifecycle: ContainerProvisionLifecycle,
  bindings: Bindings = getContainerBindings(container)
): void {
  if (lifecycle.has(container)) {
    return;
  }

  const instances: Array<object> = provisionInstances(container, bindings);

  dbg.info(prefix(__filename), "Provisioning container:", {
    container,
    instances: instances,
  });

  lifecycle.set(container, instances);
  trackProvisionLifecycle(container, lifecycle);
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
 * import { Injectable, OnDeprovision, createContainer, deprovisionContainer, provisionContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnDeprovision()
 *   public disconnect(): void {}
 * }
 *
 * const container = createContainer({ bindings: [PanelService] });
 * const lifecycle = new Map();
 *
 * provisionContainer(container, lifecycle, [PanelService]);
 * deprovisionContainer(container, lifecycle);
 * ```
 */
export function deprovisionContainer(container: Container, lifecycle: ContainerProvisionLifecycle): void {
  const instances: Maybe<Array<object>> = lifecycle.get(container);

  if (instances) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      instances,
    });

    deprovisionInstances(instances.filter((instance) => CONTAINER_REFS_BY_INSTANCE.get(instance) === container));

    for (const instance of instances) {
      PROVISION_TOKENS_BY_INSTANCE.delete(instance);
    }

    lifecycle.delete(container);

    untrackProvisionLifecycle(container, lifecycle);
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
export function deprovisionContainerBinding(container: Container, token: Identifier): void {
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

    deprovisionInstances(removed.filter((instance) => CONTAINER_REFS_BY_INSTANCE.get(instance) === container));
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
 * @remarks
 * Provisioning runs in two passes:
 *
 * - Resolve instances first, so `@OnActivated` completes before provider hooks.
 * - Call `@OnProvision` in binding order.
 *
 * Instances that inject `WireScope` participate even without provider hooks.
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
  const trackedTokens: Array<readonly [object, Identifier]> = [];
  const visited: Set<Identifier> = new Set();

  for (const binding of bindings) {
    const token: Identifier = getBindingToken(binding);
    const metadataToken: Identifier = getProviderLifecycleMetadataToken(binding);

    if (!visited.has(token) && isProviderLifecycleParticipant(metadataToken)) {
      visited.add(token);

      const instance: object = container.get(token) as object;

      trackProvisionToken(instance, token);
      trackedTokens.push([instance, token]);
      instances.push(instance);
    }
  }

  for (const instance of instances) {
    markInstanceProvisionStatus(instance, null, null);
  }

  for (let index: number = 0; index < instances.length; index += 1) {
    const instance: object = instances[index];
    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(instance);
    const provisionId: ProvisionId = (PROVISION_IDS_BY_INSTANCE.get(instance) ?? 0) + 1;

    PROVISION_IDS_BY_INSTANCE.set(instance, provisionId);

    markInstanceProvisionStatus(instance, false, provisionId);

    try {
      if (methodName) {
        callLifecycleHandler({
          args: [provisionId],
          container: CONTAINER_REFS_BY_INSTANCE.get(instance),
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

      deprovisionInstances(
        reachedInstances.filter((reachedInstance) => CONTAINER_REFS_BY_INSTANCE.get(reachedInstance) === container)
      );

      for (const [instance, token] of trackedTokens) {
        untrackProvisionToken([instance], token);
      }

      throw error;
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
    const methodName: Maybe<string | symbol> = getDeprovisionHandlerMetadata(instance);
    const provisionId: Maybe<ProvisionId> = PROVISION_IDS_BY_INSTANCE.get(instance);

    if (methodName) {
      callLifecycleHandler({
        args: provisionId === undefined ? [] : [provisionId],
        container: CONTAINER_REFS_BY_INSTANCE.get(instance),
        name: "@OnDeprovision",
        details: [instance.constructor.name, String(methodName)],
        instance,
        instanceName: instance.constructor.name,
        methodName,
        source: "provider-deprovision",
        syncFailureMessage: "@OnDeprovision failed for",
      });
    }

    markInstanceProvisionStatus(instance, true, provisionId);
  }
}

/**
 * Marks all scopes injected into a provider lifecycle instance with provision state.
 *
 * @internal
 *
 * @param instance - The instance resolved for provider lifecycle.
 * @param isDeprovisioned - Whether the instance has left provider ownership, or null before provision reaches it.
 * @param provisionId - Current provider provision cycle ID for this instance.
 */
function markInstanceProvisionStatus(
  instance: object,
  isDeprovisioned: Optional<boolean>,
  provisionId?: Optional<ProvisionId>
): void {
  const scopes: Maybe<
    ReadonlyArray<{
      readonly isDeprovisioned: Optional<boolean>;
      readonly provisionId: Optional<ProvisionId>;
    }>
  > = SCOPES_BY_INSTANCE.get(instance);

  if (!scopes) {
    dbg.info(prefix(__filename), "Skip marking instance provision status:", {
      instance,
      isDeprovisioned,
      provisionId,
      scopes,
    });

    return;
  }

  dbg.info(prefix(__filename), "Mark instance provision status:", {
    instance,
    isDeprovisioned,
    provisionId,
    scopes,
  });

  for (const scope of scopes) {
    (scope as { isDeprovisioned: Optional<boolean> }).isDeprovisioned = isDeprovisioned;

    if (provisionId !== undefined) {
      (scope as { provisionId: Optional<ProvisionId> }).provisionId = provisionId;
    }
  }
}

/**
 * Tracks a provider lifecycle map that currently owns a container.
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
}

/**
 * Removes a provider lifecycle map from a container.
 *
 * @internal
 *
 * @param container - Deprovisioned container.
 * @param lifecycle - Provider lifecycle state.
 */
function untrackProvisionLifecycle(container: Container, lifecycle: ContainerProvisionLifecycle): void {
  const lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (!lifecycles) {
    return;
  }

  lifecycles.delete(lifecycle);

  if (lifecycles.size === 0) {
    PROVISION_LIFECYCLES_BY_CONTAINER.delete(container);
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
function trackProvisionToken(instance: object, token: Identifier): void {
  let tokens: Maybe<Set<Identifier>> = PROVISION_TOKENS_BY_INSTANCE.get(instance);

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
function untrackProvisionToken(instances: ReadonlyArray<object>, token: Identifier): void {
  for (const instance of instances) {
    const tokens: Maybe<Set<Identifier>> = PROVISION_TOKENS_BY_INSTANCE.get(instance);

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
function isInstanceProvisionedForToken(instance: object, token: Identifier): boolean {
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
function getProviderLifecycleMetadataToken(binding: Binding): Identifier {
  if (typeof binding !== "function" && binding.type === BindingType.Instance && typeof binding.value === "function") {
    return binding.value as Identifier;
  }

  return getBindingToken(binding);
}

/**
 * Checks whether an instance token should participate in provider lifecycle state.
 *
 * @internal
 *
 * @param token - Binding token to inspect.
 * @returns True when the token is an instance constructor with provider lifecycle metadata or WireScope injection.
 */
function isProviderLifecycleParticipant(token: Identifier): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const prototype: Maybe<object> = token.prototype as Maybe<object>;

  return prototype
    ? Boolean(getProvisionHandlerMetadata(prototype) || getDeprovisionHandlerMetadata(prototype)) ||
        hasScopeInjection(token)
    : false;
}
