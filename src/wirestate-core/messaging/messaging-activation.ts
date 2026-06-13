import type { ContainerKernel } from "../container/container-kernel";
import type { Maybe } from "../types/general";

import { CommandBus } from "./commands/command-bus";
import type { CommandHandler } from "./commands/commands";
import { getCommandHandlerMetadata } from "./commands/on-command";
import { buildEventDispatchers } from "./events/build-event-dispatchers";
import { EventBus } from "./events/event-bus";
import type { EventDispatch, EventUnsubscribe } from "./events/events";
import { getQueryHandlerMetadata } from "./queries/on-query";
import type { QueryHandler } from "./queries/queries";
import { QueryBus } from "./queries/query-bus";

/**
 * Registers decorated event, query, and command handlers for an instance.
 *
 * @remarks
 * The messaging side of instance Activation, called by the Wirestate activation
 * adapter. Buses are resolved by token with `{ optional: true }`, so containers
 * without messaging skip handler registration gracefully. Each registration's
 * unregister callback is collected into `disposers`.
 *
 * @param container - Container that owns the instance.
 * @param instance - Activated instance.
 * @param disposers - Collector for handler unregister callbacks.
 * @internal
 */
export function registerMessagingHandlers(
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
): void {
  const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(instance, container);

  if (dispatches.length) {
    const eventBus: Maybe<EventBus> = container.get(EventBus, { optional: true });

    if (eventBus) {
      const unsubscribers: Array<EventUnsubscribe> = dispatches.map((dispatch) =>
        eventBus.subscribe(dispatch.types, dispatch.handler)
      );

      disposers.push(() => {
        for (const unsubscribe of unsubscribers) {
          unsubscribe();
        }
      });
    }
  }

  const queryHandlers = getQueryHandlerMetadata(instance);

  if (queryHandlers.length) {
    const queryBus: Maybe<QueryBus> = container.get(QueryBus, { optional: true });

    if (queryBus) {
      for (const meta of queryHandlers) {
        const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        disposers.push(queryBus.register(meta.type, (method as QueryHandler).bind(instance)));
      }
    }
  }

  const commandHandlers = getCommandHandlerMetadata(instance);

  if (commandHandlers.length) {
    const commandBus: Maybe<CommandBus> = container.get(CommandBus, { optional: true });

    if (commandBus) {
      for (const meta of commandHandlers) {
        const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

        if (typeof method !== "function") {
          continue;
        }

        disposers.push(commandBus.register(meta.type, (method as CommandHandler).bind(instance)));
      }
    }
  }
}
