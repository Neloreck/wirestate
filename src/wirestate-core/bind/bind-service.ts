import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { BindWhenOnFluentSyntax, Container, ServiceIdentifier, type Newable } from "../alias";
import { CommandBus } from "../commands/command-bus";
import { getCommandHandlerMetadata } from "../commands/get-command-handler-metadata";
import { hasWireScopeInjection } from "../container/has-wire-scope-injection";
import { WireScope } from "../container/wire-scope";
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
import { InjectableEntries } from "../types/provision";
import { QueryHandler, QueryUnregister } from "../types/queries";

import { registerContainerEntry } from "./bind-register";

/**
 * Represents options for {@link bindService}.
 *
 * @group Bind
 */
export interface BindServiceOptions {
  /**
   * Skip `@OnActivated` and `@OnDeactivation`.
   *
   * Command, query, and event handlers are still wired.
   *
   * @default false
   */
  readonly isWithIgnoreLifecycle?: boolean;
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
 * @param entry - Service class.
 * @param options - Binding options.
 *
 * @example
 * ```typescript
 * import { Injectable, OnCommand, bindService, createContainer } from "@wirestate/core";
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
 * bindService(container, SessionService);
 *
 * const service = container.get(SessionService);
 * ```
 */
export function bindService<T extends object>(
  container: Container,
  entry: Newable<T>,
  options?: BindServiceOptions
): void {
  bindServiceWithToken(container, entry, entry, entry, options);
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
 * @param token - Service identifier used to resolve the binding.
 * @param entry - Service class constructor.
 * @param registeredEntry - Entry recorded as container-owned.
 * @param options - Configuration options for the binding.
 */
export function bindServiceWithToken<T extends object>(
  container: Container,
  token: ServiceIdentifier<T>,
  entry: Newable<T>,
  registeredEntry: InjectableEntries[number],
  options?: BindServiceOptions
): void {
  dbg.info(prefix(__filename), "Binding service:", {
    name: entry.name,
    token,
    entry,
    options,
    container,
  });

  // Inversify's fluent binding API only allows a single `.onActivation` /
  // `.onDeactivation` call per chain, so we register them on the container
  // itself instead - this also works correctly if a later call rebinds the
  // same token.
  const whenBind: BindWhenOnFluentSyntax<T> = container.bind<T>(token).to(entry).inSingletonScope();

  whenBind.onActivation((context, instance) => {
    dbg.info(prefix(__filename), "Activating service:", {
      name: entry.name,
      context,
      container,
      entry,
      instance,
      options,
    });

    // Ensure flag is initialized on activation.
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = false;

    CONTAINER_REFS_BY_SERVICE.set(instance, container);
    attachWireScopes(instance, entry);

    // Compose all events listeners into a single bus subscription so we only
    // pay one Set lookup per emitted event.
    const dispatcher: Optional<EventHandler> = buildEventDispatcher(instance);

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

    if (options?.isWithIgnoreLifecycle) {
      dbg.info(prefix(__filename), "Skip lifecycle @onActivated method:", {
        name: entry.name,
        context,
        container,
        entry,
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
              console.error("[wirestate] @OnActivated rejected for:", entry.name, String(methodName), error);
            });
          }
        }
      }
    }

    return instance;
  });

  whenBind.onDeactivation((instance) => {
    dbg.info(prefix(__filename), "Deactivating service:", {
      name: entry.name,
      container,
      instance,
    });

    let deactivationMethodName: Maybe<string | symbol> = null;

    if (options?.isWithIgnoreLifecycle) {
      dbg.info(prefix(__filename), "Skip lifecycle @OnDeactivation method:", {
        name: entry.name,
        container,
        entry,
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
                console.error("[wirestate] @OnDeactivation rejected for:", entry.name, String(methodName), error);
              });
            }
          }
        } catch (error) {
          console.error(
            "[wirestate] @OnDeactivation failed for:",
            entry.name,
            String(deactivationMethodName ?? "unknown"),
            error
          );
        }
      }
    }

    // Flip the public disposal flag first so any async work already in
    // flight (fetches awaiting in @Action methods, scheduled reactions,
    // etc.) can short-circuit before it mutates the about-to-die instance.
    // The cast is the only write-site for this `readonly` field.
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = true;

    detachWireScopes(instance);
    detachCommandUnregister(instance);
    detachQueryUnregister(instance);
    detachEventSubscription(instance);

    CONTAINER_REFS_BY_SERVICE.delete(instance);
  });

  registerContainerEntry(container, registeredEntry);
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
  }

  WIRE_SCOPES_BY_SERVICE.delete(service);
}
