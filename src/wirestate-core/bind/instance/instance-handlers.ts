import { Container } from "../../alias";
import { CommandBus } from "../../commands/command-bus";
import { getCommandHandlerMetadata } from "../../commands/get-command-handler-metadata";
import { buildEventDispatchers } from "../../events/build-event-dispatchers";
import { EventBus } from "../../events/event-bus";
import { getQueryHandlerMetadata } from "../../queries/get-query-handler-metadata";
import { QueryBus } from "../../queries/query-bus";
import {
  COMMAND_UNREGISTERS_BY_INSTANCE,
  CONTAINER_REFS_BY_INSTANCE,
  EVENT_UNSUBSCRIBERS_BY_INSTANCE,
  QUERY_UNREGISTERS_BY_INSTANCE,
} from "../../registry";
import { CommandHandler, CommandUnregister } from "../../types/commands";
import { EventDispatch, EventUnsubscriber } from "../../types/events";
import { Maybe } from "../../types/general";
import { QueryHandler, QueryUnregister } from "../../types/queries";

/**
 * Registers decorated event, query, and command handlers for a service.
 *
 * @internal
 *
 * @param container - Container that owns the instance.
 * @param instance - Instance.
 */
export function registerInstanceHandlers<T extends object>(container: Container, instance: T): void {
  const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(instance, container);

  if (dispatches.length) {
    attachEventsSubscription(instance, dispatches);
  }

  const queryBus: QueryBus = container.get(QueryBus);

  for (const meta of getQueryHandlerMetadata(instance)) {
    const method = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method !== "function") {
      continue;
    }

    attachQueryUnregister(instance, queryBus.register(meta.type, (method as QueryHandler).bind(instance)));
  }

  const commandBus: CommandBus = container.get(CommandBus);

  for (const meta of getCommandHandlerMetadata(instance)) {
    const method: unknown = (instance as unknown as Record<string | symbol, unknown>)[meta.methodName];

    if (typeof method !== "function") {
      continue;
    }

    attachCommandUnregister(instance, commandBus.register(meta.type, (method as CommandHandler).bind(instance)));
  }
}

/**
 * Unregisters decorated event, query, and command handlers for a service.
 *
 * @internal
 *
 * @param instance - Service instance.
 */
export function unregisterInstanceHandlers<T extends object>(instance: T): void {
  detachCommandUnregister(instance);
  detachQueryUnregister(instance);
  detachEventSubscription(instance);
}

/**
 * Subscribes each of a service's event handlers to the bus.
 *
 * @internal
 *
 * @remarks
 * Every decorated method is subscribed independently, and the resulting
 * unsubscribers are folded into one so the service tears them all down together
 * on deactivation.
 *
 * @param service - Service instance.
 * @param dispatches - One subscription descriptor per decorated method.
 */
function attachEventsSubscription<T extends object>(service: T, dispatches: ReadonlyArray<EventDispatch>): void {
  const bus: Maybe<EventBus> = CONTAINER_REFS_BY_INSTANCE.get(service)?.get(EventBus);

  if (!bus) {
    return;
  }

  const unsubscribers: Array<EventUnsubscriber> = dispatches.map((dispatch) =>
    bus.subscribe(dispatch.types, dispatch.handler)
  );

  EVENT_UNSUBSCRIBERS_BY_INSTANCE.set(service, () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  });
}

/**
 * Detaches the event subscription from a service.
 *
 * @internal
 *
 * @param service - Service instance.
 */
function detachEventSubscription<T extends object>(service: T): void {
  const unsubscribe: Maybe<EventUnsubscriber> = EVENT_UNSUBSCRIBERS_BY_INSTANCE.get(service);

  if (unsubscribe) {
    unsubscribe();
    EVENT_UNSUBSCRIBERS_BY_INSTANCE.delete(service);
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
  let list: Maybe<Array<QueryUnregister>> = QUERY_UNREGISTERS_BY_INSTANCE.get(service);

  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_INSTANCE.set(service, list);
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
  const list: Maybe<Array<QueryUnregister>> = QUERY_UNREGISTERS_BY_INSTANCE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    unregister();
  }

  QUERY_UNREGISTERS_BY_INSTANCE.delete(service);
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
  let list: Maybe<Array<CommandUnregister>> = COMMAND_UNREGISTERS_BY_INSTANCE.get(service);

  if (!list) {
    list = [];
    COMMAND_UNREGISTERS_BY_INSTANCE.set(service, list);
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
  const list: Maybe<Array<CommandUnregister>> = COMMAND_UNREGISTERS_BY_INSTANCE.get(service);

  if (!list) {
    return;
  }

  for (const unregister of list) {
    unregister();
  }

  COMMAND_UNREGISTERS_BY_INSTANCE.delete(service);
}
