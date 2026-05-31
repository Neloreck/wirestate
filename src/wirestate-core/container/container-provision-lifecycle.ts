import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, ServiceIdentifier } from "../alias";
import { getBindingToken } from "../bind/get-binding-token";
import { hasWireScopeInjection } from "../bind/has-wire-scope-injection";
import { getContainerBindings } from "../bind/register-binding";
import { reportWirestateInternalError } from "../error/internal-error-handler";
import {
  CONTAINER_REFS_BY_SERVICE,
  PROVISION_LIFECYCLES_BY_CONTAINER,
  PROVISION_TOKENS_BY_SERVICE,
  WIRE_SCOPES_BY_SERVICE,
} from "../registry";
import { getDeprovisionHandlerMetadata } from "../service/on-deprovision";
import { getProvisionHandlerMetadata } from "../service/on-provision";
import { Maybe, MaybePromise, Optional } from "../types/general";
import { Binding, Bindings } from "../types/provision";

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

  const services: Array<object> = provisionServices(container, bindings);

  dbg.info(prefix(__filename), "Provisioning container:", {
    container,
    services,
  });

  lifecycle.set(container, services);
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
  const services: Maybe<Array<object>> = lifecycle.get(container);

  if (services) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      services,
    });

    deprovisionServices(services.filter((service) => CONTAINER_REFS_BY_SERVICE.get(service) === container));

    for (const service of services) {
      PROVISION_TOKENS_BY_SERVICE.delete(service);
    }

    lifecycle.delete(container);

    untrackProvisionLifecycle(container, lifecycle);
  }
}

/**
 * Deprovisions any provider lifecycle service represented by a binding token.
 *
 * @group Container
 * @internal
 *
 * @param container - Container losing the binding.
 * @param token - Binding token removed from the container.
 */
export function deprovisionContainerBinding(container: Container, token: ServiceIdentifier): void {
  const lifecycles: Maybe<Set<ContainerProvisionLifecycle>> = PROVISION_LIFECYCLES_BY_CONTAINER.get(container);

  if (!lifecycles) {
    return;
  }

  for (const lifecycle of Array.from(lifecycles)) {
    const services: Maybe<Array<object>> = lifecycle.get(container);

    if (!services) {
      continue;
    }

    const removed: Array<object> = [];
    const remaining: Array<object> = [];

    for (const service of services) {
      if (isServiceProvisionedForToken(service, token)) {
        removed.push(service);
      } else {
        remaining.push(service);
      }
    }

    if (removed.length === 0) {
      continue;
    }

    deprovisionServices(removed.filter((service) => CONTAINER_REFS_BY_SERVICE.get(service) === container));
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
 * Deprovisions all provider lifecycle services owned by a container.
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
 * - Resolve services first, so `@OnActivated` completes before provider hooks.
 * - Call `@OnProvision` in binding order.
 *
 * Services that inject `WireScope` participate even without provider hooks.
 *
 * @group Container
 *
 * @param container - Container that owns the bindings.
 * @param bindings - Bindings controlled by the provider.
 * @returns Services that were resolved for provider lifecycle management.
 *
 * @internal
 */
export function provisionServices(container: Container, bindings: Bindings = []): Array<object> {
  const services: Array<object> = [];
  const visited: Set<ServiceIdentifier> = new Set();

  for (const binding of bindings) {
    const token: ServiceIdentifier = getBindingToken(binding);
    const metadataToken: ServiceIdentifier = getProviderLifecycleMetadataToken(binding);

    if (!visited.has(token) && isProviderLifecycleParticipant(metadataToken)) {
      visited.add(token);

      const service: object = container.get(token) as object;

      trackProvisionToken(service, token);
      services.push(service);
    }
  }

  for (const service of services) {
    markServiceDeprovisionStatus(service, null);
  }

  for (const service of services) {
    const methodName: Maybe<string | symbol> = getProvisionHandlerMetadata(service);

    markServiceDeprovisionStatus(service, false);

    if (methodName) {
      callLifecycleHandler(service, methodName, "@OnProvision");
    }
  }

  return services;
}

/**
 * Calls deprovision hooks for provisioned services.
 *
 * @group Container
 * @internal
 *
 * @param services - Services resolved during provider provisioning.
 */
export function deprovisionServices(services: ReadonlyArray<object>): void {
  for (let index: number = services.length - 1; index >= 0; index -= 1) {
    const methodName: Maybe<string | symbol> = getDeprovisionHandlerMetadata(services[index]);

    if (methodName) {
      callLifecycleHandler(services[index], methodName, "@OnDeprovision");
    }

    markServiceDeprovisionStatus(services[index], true);
  }
}

/**
 * Marks all scopes injected into a provider lifecycle service with deprovision status.
 *
 * @internal
 *
 * @param service - Service instance resolved for provider lifecycle.
 * @param isDeprovisioned - Whether the service has left provider ownership, or null before provision reaches it.
 */
function markServiceDeprovisionStatus(service: object, isDeprovisioned: Optional<boolean>): void {
  const scopes: Maybe<ReadonlyArray<{ readonly isDeprovisioned: Optional<boolean> }>> =
    WIRE_SCOPES_BY_SERVICE.get(service);

  if (!scopes) {
    return;
  }

  for (const scope of scopes) {
    (scope as { isDeprovisioned: Optional<boolean> }).isDeprovisioned = isDeprovisioned;
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
 * Tracks which binding token caused a service to enter provider lifecycle state.
 *
 * @internal
 *
 * @param service - Provisioned service.
 * @param token - Binding token used to resolve the service.
 */
function trackProvisionToken(service: object, token: ServiceIdentifier): void {
  let tokens: Maybe<Set<ServiceIdentifier>> = PROVISION_TOKENS_BY_SERVICE.get(service);

  if (!tokens) {
    tokens = new Set();
    PROVISION_TOKENS_BY_SERVICE.set(service, tokens);
  }

  tokens.add(token);
}

/**
 * Removes one provider lifecycle token from services.
 *
 * @internal
 *
 * @param services - Services losing a lifecycle token.
 * @param token - Binding token to remove.
 */
function untrackProvisionToken(services: ReadonlyArray<object>, token: ServiceIdentifier): void {
  for (const service of services) {
    const tokens: Maybe<Set<ServiceIdentifier>> = PROVISION_TOKENS_BY_SERVICE.get(service);

    if (!tokens) {
      continue;
    }

    tokens.delete(token);

    if (tokens.size === 0) {
      PROVISION_TOKENS_BY_SERVICE.delete(service);
    }
  }
}

/**
 * Checks whether a service lifecycle entry belongs to a binding token.
 *
 * @internal
 *
 * @param service - Provisioned service.
 * @param token - Binding token to inspect.
 * @returns True when the service was provisioned for the token.
 */
function isServiceProvisionedForToken(service: object, token: ServiceIdentifier): boolean {
  return PROVISION_TOKENS_BY_SERVICE.get(service)?.has(token) ?? false;
}

/**
 * Resolves the constructor that can own provider lifecycle metadata.
 *
 * @internal
 *
 * @param binding - Binding registered on the provider container.
 * @returns Service constructor for instance descriptors, otherwise the binding token.
 */
function getProviderLifecycleMetadataToken(binding: Binding): ServiceIdentifier {
  if (typeof binding !== "function" && binding.type === BindingType.Instance && typeof binding.value === "function") {
    return binding.value as ServiceIdentifier;
  }

  return getBindingToken(binding);
}

/**
 * Checks whether a service token should participate in provider lifecycle state.
 *
 * @internal
 *
 * @param token - Binding token to inspect.
 * @returns True when the token is a service constructor with provider lifecycle metadata or WireScope injection.
 */
function isProviderLifecycleParticipant(token: ServiceIdentifier): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const prototype: Maybe<object> = token.prototype as Maybe<object>;

  return prototype
    ? Boolean(getProvisionHandlerMetadata(prototype) || getDeprovisionHandlerMetadata(prototype)) ||
        hasWireScopeInjection(token)
    : false;
}

/**
 * Calls a provider lifecycle handler and reports synchronous or asynchronous failures.
 *
 * @internal
 *
 * @param service - Service instance that owns the handler.
 * @param methodName - Handler method name.
 * @param decoratorName - Decorator name used in diagnostics.
 */
function callLifecycleHandler(service: object, methodName: string | symbol, decoratorName: string): void {
  const method: unknown = (service as Record<string | symbol, unknown>)[methodName];
  const source = decoratorName === "@OnProvision" ? "provider-provision" : "provider-deprovision";

  if (typeof method !== "function") {
    return;
  }

  dbg.info(prefix(__filename), "Calling provider lifecycle handler:", {
    name: service.constructor.name,
    service,
    methodName,
    decoratorName,
  });

  try {
    const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(service);

    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        reportWirestateInternalError({
          container: CONTAINER_REFS_BY_SERVICE.get(service),
          details: [service.constructor.name, String(methodName)],
          error,
          message: decoratorName + " rejected",
          methodName,
          service,
          serviceName: service.constructor.name,
          source,
        });
      });
    }
  } catch (error) {
    reportWirestateInternalError({
      container: CONTAINER_REFS_BY_SERVICE.get(service),
      details: [service.constructor.name, String(methodName)],
      error,
      message: decoratorName + " failed for",
      methodName,
      service,
      serviceName: service.constructor.name,
      source,
    });
  }
}
