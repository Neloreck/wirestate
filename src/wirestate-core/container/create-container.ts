import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Container, ServiceIdentifier } from "../alias";
import { bind } from "../bind/bind";
import { getBindingToken } from "../bind/get-binding-token";
import { CommandBus } from "../commands/command-bus";
import {
  getConfiguredWirestateInternalErrorHandler,
  setWirestateInternalErrorHandler,
  InternalErrorHandler,
} from "../error/internal-error-handler";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { CONTAINER_PARENT_TOKEN, SEED_TOKEN, SEEDS_TOKEN } from "../registry";
import { setSeeds } from "../seeds/set-seeds";
import { AnyObject, Maybe } from "../types/general";
import { Bindings } from "../types/provision";
import { SeedBindings, SeedsMap } from "../types/seeds";

import { validateContainerConfig } from "./validate-container-config";
import { WireScope } from "./wire-scope";

/**
 * Describes reusable {@link createContainer} config.
 *
 * @group Container
 */
export interface ContainerConfig {
  /**
   * Bindings to resolve immediately after binding.
   */
  readonly activate?: boolean | ReadonlyArray<ServiceIdentifier>;

  /**
   * Services or binding descriptors to register.
   */
  readonly bindings?: Bindings;

  /**
   * Parent container for inherited bindings.
   */
  readonly parent?: Container;

  /**
   * Handles isolated internal errors that Wirestate catches instead of
   * rethrowing, such as event handler failures and lifecycle rejections.
   */
  readonly onError?: InternalErrorHandler;

  /**
   * Shared seed object. Read it with `scope.getSeed()` or inject `SEED`.
   */
  readonly seed?: AnyObject;

  /**
   * Seed values keyed by service class, string, or symbol.
   */
  readonly seeds?: SeedBindings;
}

/**
 * Describes options for {@link createContainer}.
 *
 * @group Container
 */
export interface CreateContainerOptions {
  /**
   * Skip binding container-scoped event, query, and command buses.
   *
   * @remarks
   * Use this for tests or integration points that only need dependency
   * injection, seeds, and scope support.
   *
   * A container created with this option can inherit messaging buses from a
   * parent container. If it has no inherited buses, resolving `WireScope` will
   * fail because `WireScope` depends on `EventBus`, `QueryBus`, and `CommandBus`.
   *
   * @default `false`
   */
  readonly skipMessaging?: boolean;

  /**
   * Skip service lifecycle hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipLifecycle?: boolean;
}

/**
 * Creates a Wirestate container.
 *
 * @remarks
 * This is an Inversify container with Wirestate pieces already installed:
 *
 * - Shared seed and targeted seed tokens.
 * - Container-scoped `EventBus`, `CommandBus`, and `QueryBus`.
 * - Transient `WireScope`, so each service gets its own scope handle.
 * - Singleton default scope for normal services.
 *
 * Child containers inherit parent bindings and seed defaults, but get their
 * own buses. Passing `seed` or `seeds`, or calling seed helpers on a child,
 * creates child-local seed state.
 *
 * @group Container
 *
 * @param config - Container setup config.
 * @param options - Container creation options.
 * @returns A new Wirestate-ready {@link Container}.
 *
 * @throws {@link WirestateError} If `activate` names a token missing from `bindings`.
 *
 * @example
 * ```typescript
 * import { Container, Injectable, createContainer } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container: Container = createContainer({
 *   activate: [LoggerService],
 *   bindings: [CounterService, LoggerService],
 *   seeds: [[CounterService, { count: 10 }]],
 * });
 *
 * const logger = container.get(LoggerService);
 * ```
 */
export function createContainer(config: ContainerConfig = {}, options: CreateContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { config, options });

  validateContainerConfig(config);

  const activate: ReadonlyArray<ServiceIdentifier> =
    (config.activate === true ? config.bindings?.map(getBindingToken) : config.activate) || [];

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: config.parent,
  });
  const errorHandler: Maybe<InternalErrorHandler> =
    config.onError ?? getConfiguredWirestateInternalErrorHandler(config.parent);

  container.bind(CONTAINER_PARENT_TOKEN).toConstantValue(config.parent);
  container.bind(Container).toConstantValue(container);

  // Merge with parent seeds map.
  container
    .bind(SEEDS_TOKEN)
    .toConstantValue(
      new Map(config.parent?.isBound(SEEDS_TOKEN) ? (config.parent.get<SeedsMap>(SEEDS_TOKEN) ?? []) : []) as SeedsMap
    );

  // Fallback to parent config as default value.
  container
    .bind(SEED_TOKEN)
    .toConstantValue(
      config.seed ?? (config.parent?.isBound(SEED_TOKEN) ? (config.parent.get<AnyObject>(SEED_TOKEN) ?? {}) : {})
    );

  container
    .bind(WireScope)
    .toResolvedValue((): WireScope => new WireScope(container))
    .inTransientScope();

  if (errorHandler) {
    setWirestateInternalErrorHandler(container, errorHandler);
  }

  if (config.seeds) {
    setSeeds(container, config.seeds);
  }

  if (!options.skipMessaging) {
    container.bind(EventBus).toConstantValue(new EventBus(container));
    container.bind(QueryBus).toConstantValue(new QueryBus());
    container.bind(CommandBus).toConstantValue(new CommandBus());
  }

  dbg.info(prefix(__filename), "Injecting bindings on creation:", { container, config, options });

  if (config.bindings) {
    for (const binding of config.bindings) {
      bind(container, binding, options);
    }
  }

  for (const binding of activate) {
    container.get(binding);
  }

  return container;
}
