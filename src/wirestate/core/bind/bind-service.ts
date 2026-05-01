import { BindWhenOnFluentSyntax, Container, type Newable } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { getCommandHandlerMetadata } from "@/wirestate/core/commands/get-command-handler-metadata";
import { buildEventDispatcher } from "@/wirestate/core/events/build-event-dispatcher";
import type { EventBus } from "@/wirestate/core/events/event-bus";
import { getQueryHandlerMetadata } from "@/wirestate/core/queries/get-query-handler-metadata";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  COMMAND_BUS_TOKEN,
  COMMAND_UNREGISTERS_BY_SERVICE,
  CONTAINER_REFS_BY_SERVICE,
  QUERY_BUS_TOKEN,
  QUERY_UNREGISTERS_BY_SERVICE,
  EVENT_BUS_TOKEN,
  EVENT_UNSUBSCRIBERS_BY_SERVICE,
  WIRE_SCOPES_BY_SERVICE,
} from "@/wirestate/core/registry";
import { WireScope } from "@/wirestate/core/scope/wire-scope";
import { getActivatedHandlerMetadata } from "@/wirestate/core/service/get-activated-handler-metadata";
import { getDeactivationHandlerMetadata } from "@/wirestate/core/service/get-deactivation-handler-metadata";
import type { TCommandHandler, TCommandUnregister } from "@/wirestate/types/commands";
import type { TEventHandler, TEventUnsubscriber } from "@/wirestate/types/events";
import type { Maybe, MaybePromise, Optional } from "@/wirestate/types/general";
import type { TQueryHandler, TQueryUnregister } from "@/wirestate/types/queries";

export interface IBindServiceOptions {
  isWithIgnoreLifecycle?: boolean;
}

/**
 * Registers a service class in the container with activation/deactivation logic.
 * Ensures container references, event subscriptions, command and query handlers are managed correctly.
 *
 * @param container - target Inversify container
 * @param entry - service constructor
 * @param options - options object to control binding flow
 */
export function bindService<T extends object>(
  container: Container,
  entry: Newable<T>,
  options?: IBindServiceOptions
): void {
  dbg.info(prefix(__filename), "Binding service:", {
    name: entry.name,
    entry,
    options,
    container,
  });

  // Inversify's fluent binding API only allows a single `.onActivation` /
  // `.onDeactivation` call per chain, so we register them on the container
  // itself instead — this also works correctly if a later call rebinds the
  // same token.
  const whenBind: BindWhenOnFluentSyntax<T> = container.bind<T>(entry).to(entry).inSingletonScope();

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
    const dispatcher: Optional<TEventHandler> = buildEventDispatcher(instance);

    if (dispatcher) {
      attachEventsSubscription(instance, dispatcher);
    }

    // Register every `@OnQuery` handler on the container's QueryBus, and
    // remember the unregister functions so we can roll them back when the
    // service is deactivated.
    const queryBus: QueryBus = container.get<QueryBus>(QUERY_BUS_TOKEN);

    for (const meta of getQueryHandlerMetadata(instance)) {
      const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

      if (typeof method !== "function") {
        continue;
      }

      const unregister: TQueryUnregister = queryBus.register(meta.type, (method as TQueryHandler).bind(instance));

      attachQueryUnregister(instance, unregister);
    }

    // Register every `@OnCommand` handler on the container's CommandBus, and
    // remember the unregister functions so we can roll them back when the
    // service is deactivated.
    const commandBus: CommandBus = container.get<CommandBus>(COMMAND_BUS_TOKEN);

    for (const meta of getCommandHandlerMetadata(instance)) {
      const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

      if (typeof method !== "function") {
        continue;
      }

      const unregister: TCommandUnregister = commandBus.register(meta.type, (method as TCommandHandler).bind(instance));

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
      // Call every `@OnActivated`-decorated method in base-to-derived order.
      // Fire-and-forget any async init so we stay synchronous from the
      // container's point of view.
      for (const methodName of getActivatedHandlerMetadata(instance)) {
        const method = (instance as unknown as Record<string | symbol, unknown>)[methodName];

        if (typeof method !== "function") {
          continue;
        }

        const result: MaybePromise<void> = (method as () => MaybePromise<void>).call(instance);

        if (result && typeof (result as Promise<void>).then === "function") {
          (result as Promise<void>).catch((error) => {
            console.error("[wirestate] @OnActivated rejected for:", entry.name, String(methodName), error);
          });
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

    if (options?.isWithIgnoreLifecycle) {
      dbg.info(prefix(__filename), "Skip lifecycle @OnDeactivation method:", {
        name: entry.name,
        container,
        entry,
        instance,
        options,
      });
    } else {
      // Call every `@OnDeactivation`-decorated method in base-to-derived order.
      for (const methodName of getDeactivationHandlerMetadata(instance)) {
        const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[methodName];

        if (typeof method === "function") {
          (method as () => void).call(instance);
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
}

/**
 * Attaches a event subscription to a service.
 *
 * @param service - service instance
 * @param handler - event handler
 * @internal
 */
function attachEventsSubscription<T extends object>(service: T, handler: TEventHandler): void {
  const bus: Maybe<EventBus> = CONTAINER_REFS_BY_SERVICE.get(service)?.get<EventBus>(EVENT_BUS_TOKEN);

  if (bus) {
    EVENT_UNSUBSCRIBERS_BY_SERVICE.set(service, bus.subscribe(handler));
  }
}

/**
 * Detaches the event subscription from a service.
 *
 * @param service - service instance
 * @internal
 */
function detachEventSubscription<T extends object>(service: T): void {
  const unsubscribe: Maybe<TEventUnsubscriber> = EVENT_UNSUBSCRIBERS_BY_SERVICE.get(service);

  if (unsubscribe) {
    unsubscribe();
    EVENT_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}

/**
 * Registers a query unregister function for a service.
 *
 * @param service - service instance
 * @param unregister - query unregister function
 * @internal
 */
function attachQueryUnregister<T extends object>(service: T, unregister: TQueryUnregister): void {
  let list: Maybe<Array<TQueryUnregister>> = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }

  list.push(unregister);
}

/**
 * Executes and removes all query unregister functions for a service.
 *
 * @param service - service instance
 * @internal
 */
function detachQueryUnregister<T extends object>(service: T): void {
  const list: Maybe<Array<TQueryUnregister>> = QUERY_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    try {
      unregister();
    } catch (error) {
      console.error("[wirestate] query unregister threw:", error);
    }
  }

  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}

/**
 * Registers a command unregister function for a service.
 *
 * @param service - service instance
 * @param unregister - command unregister function
 * @internal
 */
function attachCommandUnregister<T extends object>(service: T, unregister: TCommandUnregister): void {
  let list: Maybe<Array<TCommandUnregister>> = COMMAND_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    list = [];
    COMMAND_UNREGISTERS_BY_SERVICE.set(service, list);
  }

  list.push(unregister);
}

/**
 * Executes and removes all command unregister functions for a service.
 *
 * @param service - service instance
 * @internal
 */
function detachCommandUnregister<T extends object>(service: T): void {
  const list: Maybe<Array<TCommandUnregister>> = COMMAND_UNREGISTERS_BY_SERVICE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    try {
      unregister();
    } catch (error) {
      console.error("[wirestate] command unregister threw:", error);
    }
  }

  COMMAND_UNREGISTERS_BY_SERVICE.delete(service);
}

/**
 * Reads `design:paramtypes` from the service constructor to find parameters typed as WireScope.
 * Property iteration happens only when the constructor metadata declares a WireScope
 * parameter, avoiding false positives from manually created or subclassed scopes.
 *
 * todo: Simplify this part.
 *
 * @param service - service instance
 * @param Service - service constructor
 * @internal
 */
function attachWireScopes<T extends object>(service: T, Service: Newable<T>): void {
  const paramTypes = Reflect.getMetadata("design:paramtypes", Service) as Array<unknown> | undefined;

  if (!paramTypes?.some((type) => type === WireScope)) {
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
 * todo: Simplify this part.
 *
 * @param service - service instance
 * @internal
 */
function detachWireScopes<T extends object>(service: T): void {
  const scopes: Maybe<Array<WireScope>> = WIRE_SCOPES_BY_SERVICE.get(service);

  if (!scopes) {
    return;
  }

  for (const scope of scopes) {
    (scope as { isDisposed: boolean }).isDisposed = true;
    (scope as unknown as { container: Optional<Container> }).container = null;
  }

  WIRE_SCOPES_BY_SERVICE.delete(service);
}
