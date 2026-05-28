import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, ServiceIdentifier } from "../alias";
import { getBindingToken } from "../bind/get-binding-token";
import { hasWireScopeInjection } from "../container/has-wire-scope-injection";
import { WIRE_SCOPES_BY_SERVICE } from "../registry";
import { Maybe, MaybePromise, Optional } from "../types/general";
import { Bindings } from "../types/provision";

import { getDeprovisionHandlerMetadata } from "./on-deprovision";
import { getProvisionHandlerMetadata } from "./on-provision";

/**
 * Represents provider lifecycle state keyed by container.
 *
 * Framework adapters keep one map per provider tree.
 *
 * @group Service
 */
export type ProvisionLifecycle = Map<Container, Array<object>>;

/**
 * Provisions a container for a framework provider.
 *
 * @remarks
 * Resolves lifecycle participants and calls `@OnProvision` once for this
 * provision cycle. It also tracks injected `WireScope` instances so
 * `scope.isDeprovisioned` matches provider ownership.
 *
 * @group Service
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
 * provisionContainer(container, lifecycle, [PanelService]);
 * ```
 */
export function provisionContainer(container: Container, lifecycle: ProvisionLifecycle, bindings: Bindings = []): void {
  if (lifecycle.has(container)) {
    return;
  }

  const services: Array<object> = provisionServices(container, bindings);

  dbg.info(prefix(__filename), "Provisioning container:", {
    container,
    services,
  });

  lifecycle.set(container, services);
}

/**
 * Deprovisions a container for a framework provider.
 *
 * @group Service
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
export function deprovisionContainer(container: Container, lifecycle: ProvisionLifecycle): void {
  const services: Maybe<Array<object>> = lifecycle.get(container);

  if (services) {
    dbg.info(prefix(__filename), "Deprovisioning container:", {
      container,
      services,
    });

    deprovisionServices(services);
    lifecycle.delete(container);
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
 * @group Service
 *
 * @param container - Container that owns the bindings.
 * @param bindings - Bindings controlled by the provider.
 * @returns Services that were resolved for provider lifecycle management.
 *
 * @example
 * ```typescript
 * import { Injectable, OnProvision, createContainer, provisionServices } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnProvision()
 *   public connect(): void {}
 * }
 *
 * const container = createContainer({ bindings: [PanelService] });
 * const services = provisionServices(container, [PanelService]);
 * ```
 */
export function provisionServices(container: Container, bindings: Bindings = []): Array<object> {
  const services: Array<object> = [];
  const visited: Set<ServiceIdentifier> = new Set();

  for (const binding of bindings) {
    const token: ServiceIdentifier = getBindingToken(binding);
    const metadataToken: ServiceIdentifier = getProviderLifecycleMetadataToken(binding);

    if (!visited.has(token) && isProviderLifecycleParticipant(metadataToken)) {
      visited.add(token);
      services.push(container.get(token) as object);
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
 * @group Service
 *
 * @param services - Services resolved during provider provisioning.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeprovision, createContainer, deprovisionServices, provisionServices } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnDeprovision()
 *   public disconnect(): void {}
 * }
 *
 * const container = createContainer({ bindings: [PanelService] });
 * const services = provisionServices(container, [PanelService]);
 *
 * deprovisionServices(services);
 * ```
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
  const scopes: Maybe<ReadonlyArray<{ readonly isDeprovisioned: boolean | null }>> =
    WIRE_SCOPES_BY_SERVICE.get(service);

  if (!scopes) {
    return;
  }

  for (const scope of scopes) {
    (scope as { isDeprovisioned: Optional<boolean> }).isDeprovisioned = isDeprovisioned;
  }
}

/**
 * Resolves the constructor that can own provider lifecycle metadata.
 *
 * @internal
 *
 * @param binding - Binding registered on the provider container.
 * @returns Service constructor for instance descriptors, otherwise the binding token.
 */
function getProviderLifecycleMetadataToken(binding: Bindings[number]): ServiceIdentifier {
  if (
    typeof binding !== "function" &&
    binding.bindingType === BindingType.Instance &&
    typeof binding.value === "function"
  ) {
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
        console.error(
          "[wirestate] " + decoratorName + " rejected for:",
          service.constructor.name,
          String(methodName),
          error
        );
      });
    }
  } catch (error) {
    console.error("[wirestate] " + decoratorName + " failed for:", service.constructor.name, String(methodName), error);
  }
}
