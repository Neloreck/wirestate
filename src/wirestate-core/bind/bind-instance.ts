import type { BindWhenOnFluentSyntax } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindingType, Container, Newable, ServiceIdentifier } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { getCommandHandlerMetadata } from "../commands/get-command-handler-metadata";
import { WireScope } from "../container/wire-scope";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { reportWirestateInternalError } from "../error/internal-error-handler";
import { WirestateError } from "../error/wirestate-error";
import { buildEventDispatcher } from "../events/build-event-dispatcher";
import { EventBus } from "../events/event-bus";
import { getQueryHandlerMetadata } from "../queries/get-query-handler-metadata";
import { QueryBus } from "../queries/query-bus";
import {
  COMMAND_UNREGISTERS_BY_SERVICE,
  CONTAINER_REFS_BY_SERVICE,
  EVENT_UNSUBSCRIBERS_BY_SERVICE,
  QUERY_UNREGISTERS_BY_SERVICE,
  WIRE_SCOPES_BY_SERVICE,
} from "../registry";
import { getActivatedHandlerMetadata } from "../service/on-activated";
import { getDeactivationHandlerMetadata } from "../service/on-deactivation";
import { CommandHandler, CommandUnregister } from "../types/commands";
import { EventHandler, EventUnsubscriber } from "../types/events";
import { Maybe, MaybePromise, Optional } from "../types/general";
import { InstanceBindingDescriptor } from "../types/provision";
import { QueryHandler, QueryUnregister } from "../types/queries";

import { hasWireScopeInjection } from "./has-wire-scope-injection";
import { registerBinding } from "./register-binding";
import { validateBindingDescriptor } from "./validate-binding-descriptor";

/**
 * Validates that an instance descriptor can be bound by {@link bindInstanceWithToken}.
 *
 * @group Bind
 * @internal
 *
 * @param descriptor - Descriptor to validate.
 *
 * @throws {@link WirestateError} If shared descriptor fields are invalid or
 * the descriptor value is not a service constructor.
 */
function validateInstanceDescriptor(descriptor: InstanceBindingDescriptor): void {
  validateBindingDescriptor(descriptor);

  if (descriptor.type === BindingType.Instance && typeof descriptor.value !== "function") {
    throw new WirestateError(
      "Instance descriptor 'value' must be a service constructor.",
      ERROR_CODE_INVALID_ARGUMENTS
    );
  }
}

/**
 * Describes options for {@link bindInstance}.
 *
 * @group Bind
 */
export interface BindInstanceOptions {
  /**
   * Skip `@OnActivated` and `@OnDeactivation`.
   *
   * Command, query, and event handlers are still wired.
   *
   * @default false
   */
  readonly skipLifecycle?: boolean;
}

/**
 * Binds a service class as a Wirestate singleton.
 *
 * @remarks
 * Use this for classes that should participate in Wirestate lifecycle.
 *
 * The binding does four jobs:
 *
 * - Resolves one service instance per container.
 * - Runs `@OnActivated` and `@OnDeactivation`.
 * - Registers `@OnEvent`, `@OnCommand`, and `@OnQuery` handlers.
 * - Tracks injected `WireScope` instances so stale async work can stop.
 *
 * @group Bind
 *
 * @template T - Service instance type.
 *
 * @param container - Container to bind into.
 * @param binding - Service class.
 * @param options - Binding options.
 * @returns The same container for chaining or immediate resolution.
 *
 * @example
 * ```typescript
 * import { Injectable, OnCommand, bind, createContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class SessionService {
 *   private active = false;
 *
 *   @OnCommand("LOGIN")
 *   public login(): void {
 *     this.active = true;
 *   }
 *
 *   public isActive(): boolean {
 *     return this.active;
 *   }
 * }
 *
 * const container = createContainer();
 *
 * bind(container, SessionService);
 *
 * const service = container.get(SessionService);
 * ```
 */
export function bindInstance<T extends object>(
  container: Container,
  binding: Newable<T>,
  options?: BindInstanceOptions
): Container {
  return bindInstanceWithToken(container, binding, binding, binding, options);
}

/**
 * Binds a service class behind a custom token while preserving Wirestate lifecycle wiring.
 *
 * @group Bind
 * @internal
 *
 * @template T - Type of the service instance.
 *
 * @param container - Target Inversify {@link Container}.
 * @param token - Service token used to resolve the binding.
 * @param binding - Service class constructor.
 * @param registeredBinding - Binding recorded as container-owned.
 * @param options - Configuration options for the binding.
 * @returns The same container for chaining or immediate resolution.
 */
export function bindInstanceWithToken<T extends object>(
  container: Container,
  token: ServiceIdentifier<T>,
  binding: Newable<T>,
  registeredBinding: Newable<T> | InstanceBindingDescriptor<T>,
  options?: BindInstanceOptions
): Container {
  if (typeof registeredBinding !== "function") {
    validateInstanceDescriptor(registeredBinding);
  }

  dbg.info(prefix(__filename), "Binding service:", {
    name: binding.name,
    token,
    binding,
    options,
    container,
  });

  // Inversify's fluent binding API only allows a single `.onActivation` /
  // `.onDeactivation` call per chain, so we register them on the container
  // itself instead - this also works correctly if a later call rebinds the
  // same token.
  const whenBind: BindWhenOnFluentSyntax<T> = container.bind<T>(token).to(binding).inSingletonScope();

  whenBind.onActivation((context, instance) => {
    dbg.info(prefix(__filename), "Activating service:", {
      name: binding.name,
      context,
      container,
      binding,
      instance,
      options,
    });

    try {
      CONTAINER_REFS_BY_SERVICE.set(instance, container);
      attachWireScopes(instance, binding);

      // Compose all events listeners into a single bus subscription so we only
      // pay one Set lookup per emitted event.
      const dispatcher: Optional<EventHandler> = buildEventDispatcher(instance, container);

      if (dispatcher) {
        attachEventsSubscription(instance, dispatcher);
      }

      // Register every `@OnQuery` handler on the container's QueryBus, and
      // remember the unregister functions so we can roll them back when the
      // service is deactivated.
      const queryBus: QueryBus = container.get(QueryBus);

      for (const meta of getQueryHandlerMetadata(instance)) {
        const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        const unregister: QueryUnregister = queryBus.register(meta.type, (method as QueryHandler).bind(instance));

        attachQueryUnregister(instance, unregister);
      }

      // Register every `@OnCommand` handler on the container's CommandBus, and
      // remember the unregister functions so we can roll them back when the
      // service is deactivated.
      const commandBus: CommandBus = container.get(CommandBus);

      for (const meta of getCommandHandlerMetadata(instance)) {
        const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        const unregister: CommandUnregister = commandBus.register(meta.type, (method as CommandHandler).bind(instance));

        attachCommandUnregister(instance, unregister);
      }

      if (options?.skipLifecycle) {
        dbg.info(prefix(__filename), "Skip lifecycle @onActivated method:", {
          name: binding.name,
          context,
          container,
          binding,
          instance,
          options,
        });
      } else {
        // Fire-and-forget any async init so we stay synchronous from the
        // container's point of view.
        const methodName: Maybe<string | symbol> = getActivatedHandlerMetadata(instance);

        if (methodName) {
          const method = (instance as unknown as Record<string | symbol, unknown>)[methodName];

          if (typeof method === "function") {
            const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(instance);

            if (result && typeof (result as Promise<void>).then === "function") {
              (result as Promise<void>).catch((error) => {
                reportWirestateInternalError({
                  container,
                  details: [binding.name, String(methodName)],
                  error,
                  message: "@OnActivated rejected",
                  methodName,
                  service: instance,
                  serviceName: binding.name,
                  source: "service-activation",
                });
              });
            }
          }
        }
      }

      return instance;
    } catch (error) {
      cleanupFailedActivation(instance);

      throw error;
    }
  });

  whenBind.onDeactivation((instance) => {
    dbg.info(prefix(__filename), "Deactivating service:", {
      name: binding.name,
      container,
      instance,
    });

    let deactivationMethodName: Maybe<string | symbol> = null;

    if (options?.skipLifecycle) {
      dbg.info(prefix(__filename), "Skip lifecycle @OnDeactivation method:", {
        name: binding.name,
        container,
        binding,
        instance,
        options,
      });
    } else {
      const methodName: Maybe<string | symbol> = getDeactivationHandlerMetadata(instance);

      deactivationMethodName = methodName;

      if (methodName) {
        const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[methodName];

        try {
          if (typeof method === "function") {
            const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(instance);

            if (result && typeof (result as Promise<void>).then === "function") {
              (result as Promise<void>).catch((error) => {
                reportWirestateInternalError({
                  container,
                  details: [binding.name, String(methodName)],
                  error,
                  message: "@OnDeactivation rejected",
                  methodName,
                  service: instance,
                  serviceName: binding.name,
                  source: "service-deactivation",
                });
              });
            }
          }
        } catch (error) {
          reportWirestateInternalError({
            container,
            details: [binding.name, String(deactivationMethodName ?? "unknown")],
            error,
            message: "@OnDeactivation failed",
            methodName: deactivationMethodName ?? undefined,
            service: instance,
            serviceName: binding.name,
            source: "service-deactivation",
          });
        }
      }
    }

    detachWireScopes(instance);
    detachCommandUnregister(instance);
    detachQueryUnregister(instance);
    detachEventSubscription(instance);

    CONTAINER_REFS_BY_SERVICE.delete(instance);
  });

  registerBinding(container, registeredBinding);

  return container;
}

/**
 * Attaches an event subscription to a service.
 *
 * @internal
 *
 * @param service - Service instance.
 * @param handler - Event handler.
 */
function attachEventsSubscription<T extends object>(service: T, handler: EventHandler): void {
  const bus: Maybe<EventBus> = CONTAINER_REFS_BY_SERVICE.get(service)?.get(EventBus);

  if (bus) {
    EVENT_UNSUBSCRIBERS_BY_SERVICE.set(service, bus.subscribe(handler));
  }
}

/**
 * Detaches the event subscription from a service.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function detachEventSubscription<T extends object>(service: T): void {
  const unsubscribe: Maybe<EventUnsubscriber> = EVENT_UNSUBSCRIBERS_BY_SERVICE.get(service);

  if (unsubscribe) {
    unsubscribe();
    EVENT_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}

/**
 * Rolls back registrations made before a service finishes activation.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function cleanupFailedActivation<T extends object>(service: T): void {
  detachWireScopes(service);
  detachCommandUnregister(service);
  detachQueryUnregister(service);
  detachEventSubscription(service);

  CONTAINER_REFS_BY_SERVICE.delete(service);
}

/**
 * Registers a query unregister function for a service.
 *
 * @internal
 *
 * @param service - Service instance.
 * @param unregister - Query unregister function.
 */
function attachQueryUnregister<T extends object>(service: T, unregister: QueryUnregister): void {
  let list: Maybe<Array<QueryUnregister>> = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }

  list.push(unregister);
}

/**
 * Executes and removes all query unregister functions for a service.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function detachQueryUnregister<T extends object>(service: T): void {
  const list: Maybe<Array<QueryUnregister>> = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    unregister();
  }

  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}

/**
 * Registers a command unregister function for a service.
 *
 * @internal
 *
 * @param service - Service instance.
 * @param unregister - Command unregister function.
 */
function attachCommandUnregister<T extends object>(service: T, unregister: CommandUnregister): void {
  let list: Maybe<Array<CommandUnregister>> = COMMAND_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    list = [];
    COMMAND_UNREGISTERS_BY_SERVICE.set(service, list);
  }

  list.push(unregister);
}

/**
 * Executes and removes all command unregister functions for a service.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function detachCommandUnregister<T extends object>(service: T): void {
  const list: Maybe<Array<CommandUnregister>> = COMMAND_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    unregister();
  }

  COMMAND_UNREGISTERS_BY_SERVICE.delete(service);
}

/**
 * Reads `design:paramtypes` from the service constructor to find parameters typed as WireScope.
 * Property iteration happens only when the constructor metadata declares a WireScope
 * parameter, avoiding false positives from manually created or subclassed scopes.
 *
 * Todo: Simplify this part..
 *
 * @internal
 *
 * @param service - Service instance.
 * @param Service - Service constructor.
 */
function attachWireScopes<T extends object>(service: T, Service: Newable<T>): void {
  if (!hasWireScopeInjection(Service, { isRequired: true })) {
    return;
  }

  const scopes: Array<WireScope> = [];

  for (const key of Object.getOwnPropertyNames(service)) {
    const value = (service as Record<string, unknown>)[key];

    if ((value as Optional<object>)?.constructor === WireScope) {
      scopes.push(value as WireScope);
    }
  }

  if (scopes.length > 0) {
    WIRE_SCOPES_BY_SERVICE.set(service, scopes);
  }
}

/**
 * Marks all injected WireScope instances for this service as disposed and removes
 * the stored references.
 *
 * Todo: Simplify this part.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function detachWireScopes<T extends object>(service: T): void {
  const scopes: Maybe<Array<WireScope>> = WIRE_SCOPES_BY_SERVICE.get(service);

  if (!scopes) {
    return;
  }

  for (const scope of scopes) {
    (scope as { isDisposed: boolean }).isDisposed = true;
    (scope as { isDeprovisioned: boolean }).isDeprovisioned = true;
    (scope as unknown as { container: Optional<Container> }).container = null;
    (scope as unknown as { commandBus: Optional<CommandBus> }).commandBus = null;
    (scope as unknown as { eventBus: Optional<EventBus> }).eventBus = null;
    (scope as unknown as { queryBus: Optional<QueryBus> }).queryBus = null;
  }

  WIRE_SCOPES_BY_SERVICE.delete(service);
}
