import { BindWhenOnFluentSyntax, Container, type Newable } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { getCommandHandlerMetadata } from "@/wirestate/core/commands/get-command-handler-metadata";
import { getQueryHandlerMetadata } from "@/wirestate/core/queries/get-query-handler-metadata";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  COMMAND_BUS_TOKEN,
  COMMAND_UNREGISTERS_BY_SERVICE,
  CONTAINER_REFS_BY_SERVICE,
  QUERY_BUS_TOKEN,
  QUERY_UNREGISTERS_BY_SERVICE,
  SIGNAL_BUS_TOKEN,
  SIGNAL_UNSUBSCRIBERS_BY_SERVICE,
} from "@/wirestate/core/registry";
import { getActivatedHandlerMetadata } from "@/wirestate/core/service/get-activated-handler-metadata";
import { getDeactivationHandlerMetadata } from "@/wirestate/core/service/get-deactivation-handler-metadata";
import { buildSignalDispatcher } from "@/wirestate/core/signals/build-signal-dispatcher";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TCommandHandler, TCommandUnregister } from "@/wirestate/types/commands";
import type { Maybe, MaybePromise, Optional } from "@/wirestate/types/general";
import type { TQueryHandler, TQueryUnregister } from "@/wirestate/types/queries";
import type { TSignalHandler, TSignalUnsubscribe } from "@/wirestate/types/signals";

export interface IBindServiceOptions {
  isWithIgnoreLifecycle?: boolean;
}

/**
 * Registers a service class in the container with activation/deactivation logic.
 * Ensures container references, signal subscriptions, and query handlers are managed correctly.
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

  if (options?.isWithIgnoreLifecycle) {
    return;
  }

  whenBind.onActivation((ctx, instance) => {
    dbg.info(prefix(__filename), "Activating service:", {
      name: entry.name,
      ctx,
      container,
      entry,
      instance,
    });

    // Ensure flag is initialized on activation.
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = false;

    CONTAINER_REFS_BY_SERVICE.set(instance, container);

    // Compose all signal listeners into a single bus subscription so we only
    // pay one Set lookup per emitted signal.
    const dispatcher: Optional<TSignalHandler> = buildSignalDispatcher(instance);

    if (dispatcher) {
      _attachSignalSub(instance, dispatcher);
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

      const unregister = queryBus.register(meta.type, (method as TQueryHandler).bind(instance));

      _attachQueryUnreg(instance, unregister);
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

      _attachCommandUnregister(instance, unregister);
    }

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

    return instance;
  });

  whenBind.onDeactivation((instance) => {
    dbg.info(prefix(__filename), "Deactivating service:", {
      name: entry.name,
      container,
      instance,
    });

    // Call every `@OnDeactivation`-decorated method in base-to-derived order.
    for (const methodName of getDeactivationHandlerMetadata(instance)) {
      const method = (instance as unknown as Record<string | symbol, unknown>)[methodName];

      if (typeof method === "function") {
        (method as () => void).call(instance);
      }
    }

    // Flip the public disposal flag first so any async work already in
    // flight (fetches awaiting in @Action methods, scheduled reactions,
    // etc.) can short-circuit before it mutates the about-to-die instance.
    // The cast is the only write-site for this `readonly` field.
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = true;

    _detachCommandUnregister(instance);
    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);
  });
}

/**
 * Attaches a signal subscription to a service.
 *
 * @param service - service instance
 * @param handler - signal handler
 * @internal
 */
export function _attachSignalSub<T extends object>(service: T, handler: TSignalHandler): void {
  const bus: Maybe<SignalBus> = CONTAINER_REFS_BY_SERVICE.get(service)?.get<SignalBus>(SIGNAL_BUS_TOKEN);

  if (bus) {
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.set(service, bus.subscribe(handler));
  }
}

/**
 * Detaches the signal subscription from a service.
 *
 * @param service - service instance
 * @internal
 */
export function _detachSignalSub<T extends object>(service: T): void {
  const unsubscribe: Maybe<TSignalUnsubscribe> = SIGNAL_UNSUBSCRIBERS_BY_SERVICE.get(service);

  if (unsubscribe) {
    unsubscribe();
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}

/**
 * Registers a query unregister function for a service.
 *
 * @param service - service instance
 * @param unregister - query unregister function
 * @internal
 */
export function _attachQueryUnreg<T extends object>(service: T, unregister: TQueryUnregister): void {
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
export function _detachQueryUnregs<T extends object>(service: T): void {
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
export function _attachCommandUnregister<T extends object>(service: T, unregister: TCommandUnregister): void {
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
export function _detachCommandUnregister<T extends object>(service: T): void {
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
