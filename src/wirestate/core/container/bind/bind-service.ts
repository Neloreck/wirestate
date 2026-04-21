import { BindWhenOnFluentSyntax, Container, type Newable, type ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { getQueryHandlerMetadata } from "@/wirestate/core/queries/get-query-handler-metadata";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  CONTAINER_REFS_BY_SERVICE,
  QUERY_BUS_TOKEN,
  QUERY_UNREGISTERS_BY_SERVICE,
  SIGNAL_BUS_TOKEN,
  SIGNAL_UNSUBSCRIBERS_BY_SERVICE,
} from "@/wirestate/core/registry";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { buildSignalDispatcher } from "@/wirestate/core/signals/build-signal-dispatcher";
import type { SignalBus } from "@/wirestate/core/signals/signal-bus";
import { Maybe, MaybePromise, Optional } from "@/wirestate/types/general";
import type { TQueryHandler, TQueryUnregister } from "@/wirestate/types/queries";
import type { TSignalHandler, TSignalUnsubscribe } from "@/wirestate/types/signals";

export interface IBindServiceOptions {
  isWithIgnoreLifecycle?: boolean;
}

/**
 * Registers an AbstractService in the container with activation/deactivation logic.
 * Ensures container references, signal subscriptions, and query handlers are managed correctly.
 *
 * @param container - target Inversify container
 * @param entry - service constructor
 * @param options - options object to control binding flow
 */
export function bindService<T extends AbstractService>(
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

    CONTAINER_REFS_BY_SERVICE.set(instance, container);

    // Compose all signal listeners (the catch-all `onSignal` hook plus every
    // `@OnSignal`-decorated method) into a single bus subscription so we only
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

    const result: MaybePromise<void> = instance.onActivated() as MaybePromise<void>;

    // Fire-and-forget any async init so we stay synchronous from the
    // container's point of view. Services that need strict async
    // bootstrapping can await their initialization elsewhere.
    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        console.error("[wirestate] onActivated rejected for:", entry.name, error);
      });
    }

    return instance;
  });

  whenBind.onDeactivation((instance) => {
    dbg.info(prefix(__filename), "Deactivating service:", {
      name: entry.name,
      container,
      instance,
    });

    // Flip the public disposal flag first so any async work already in
    // flight (fetches awaiting in @Action methods, scheduled reactions,
    // etc.) can short-circuit before it mutates the about-to-die instance.
    // The cast is the only write-site for this `readonly` field.
    // todo: Kill signalling methods of disposed instances, unlink containers?
    (instance as { IS_DISPOSED: boolean }).IS_DISPOSED = true;

    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);

    return instance.onDeactivated();
  });
}

/**
 * Attaches a signal subscription to a service.
 *
 * @param service - service instance
 * @param handler - signal handler
 * @internal
 */
export function _attachSignalSub(service: AbstractService, handler: TSignalHandler): void {
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
export function _detachSignalSub(service: AbstractService): void {
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
export function _attachQueryUnreg(service: AbstractService, unregister: TQueryUnregister): void {
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
export function _detachQueryUnregs(service: AbstractService): void {
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
