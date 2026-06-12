import { CommandBus } from "../commands/command-bus";
import { getCommandHandlerMetadata } from "../commands/get-command-handler-metadata";
import { buildEventDispatchers } from "../events/build-event-dispatchers";
import { EventBus } from "../events/event-bus";
import { getQueryHandlerMetadata } from "../queries/get-query-handler-metadata";
import { QueryBus } from "../queries/query-bus";
import type { CommandHandler } from "../types/commands";
import type { EventDispatch, EventUnsubscriber } from "../types/events";
import type { Maybe } from "../types/general";
import type { QueryHandler } from "../types/queries";

import type { ContainerKernel } from "./container-kernel";

/**
 * Registers decorated event, query, and command handlers for an instance.
 *
 * @remarks
 * The messaging side of instance Activation, installed by the {@link Container}
 * composition constructor. Buses are resolved by token with `{ optional: true }`,
 * so containers without messaging skip handler registration gracefully. Each
 * registration's unregister callback is collected into `disposers`.
 *
 * @param container - Container that owns the instance.
 * @param instance - Activated instance.
 * @param disposers - Collector for handler unregister callbacks.
 * @internal
 */
export function messagingActivationAdapter(
  container: ContainerKernel,
  instance: object,
  disposers: Array<() => void>
): void {
  const dispatches: ReadonlyArray<EventDispatch> = buildEventDispatchers(instance, container);

  if (dispatches.length) {
    const eventBus: Maybe<EventBus> = container.get(EventBus, { optional: true });

    if (eventBus) {
      const unsubscribers: Array<EventUnsubscriber> = dispatches.map((dispatch) =>
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
