import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Identifier } from "../binding/tokens";
import { CommandBus } from "../commands/command-bus";
import { getConfiguredInternalErrorHandler, setInternalErrorHandler } from "../error/internal-error-handler";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../registry";
import { InternalErrorHandler } from "../types/error";
import { AnyObject, Maybe } from "../types/general";
import { Bindings } from "../types/provision";
import { SeedBindings, SeedsMap } from "../types/seeds";

import { Container } from "./container";
import { getBindingToken } from "./get-binding-token";
import { applySkipActivationHooks } from "./skip-activation-hooks";
import { validateContainerConfig } from "./validate-container-config";
import { WireScope } from "./wire-scope";

/**
 * Describes reusable {@link createContainer} config.
 *
 * @group Container
 */
export interface ContainerConfig {
  /**
   * Bindings to resolve immediately.
   */
  readonly activate?: boolean | ReadonlyArray<Identifier>;

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
   * Seed values keyed by class, string, or symbol.
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
   * A child container can still inherit buses from its parent. Without inherited
   * buses, resolving `WireScope` fails because it depends on `EventBus`,
   * `QueryBus`, and `CommandBus`.
   *
   * @default `false`
   */
  readonly skipMessaging?: boolean;

  /**
   * Skip `@OnActivated` and `@OnDeactivation` hooks for class bindings.
   *
   * @default `false`
   */
  readonly skipActivationHooks?: boolean;
}

/**
 * Creates a Wirestate container.
 *
 * @remarks
 * Returns a Wirestate container with these pieces installed:
 *
 * - Shared seed and targeted seed tokens.
 * - Container-scoped `EventBus`, `CommandBus`, and `QueryBus`.
 * - Transient `WireScope`, so each instance gets its own scope handle.
 * - Singleton default scope for declared classes.
 *
 * Child containers inherit parent bindings and seed defaults, but get their own
 * buses. Passing `seed` or `seeds` creates child-local seed state.
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
  dbg.info(prefix(__filename), "Creating container:", { config, options });

  validateContainerConfig(config);

  const activate: ReadonlyArray<Identifier> =
    (config.activate === true ? config.bindings?.map(getBindingToken) : config.activate) || [];

  const container: Container = new Container(config.parent);

  const errorHandler: Maybe<InternalErrorHandler> = config.onError ?? getConfiguredInternalErrorHandler(config.parent);

  // Merge with parent seeds map.
  const seeds = new Map(
    config.parent?.has(SEEDS_TOKEN) ? (config.parent.get<SeedsMap>(SEEDS_TOKEN) ?? []) : []
  ) as SeedsMap;

  if (config.seeds) {
    for (const [key, value] of config.seeds) {
      seeds.set(key, value);
    }
  }

  container.bind({ token: SEEDS_TOKEN, value: seeds });

  // Fallback to parent config as default value.
  container.bind({
    token: SEED_TOKEN,
    value: config.seed ?? (config.parent?.has(SEED_TOKEN) ? (config.parent.get<AnyObject>(SEED_TOKEN) ?? {}) : {}),
  });

  container.bind({
    token: WireScope,
    scope: "Transient",
    factory: (): WireScope => new WireScope(container),
  });

  if (errorHandler) {
    setInternalErrorHandler(container, errorHandler);
  }

  if (!options.skipMessaging) {
    container.bind({ token: EventBus, value: new EventBus(container) });
    container.bind({ token: QueryBus, value: new QueryBus() });
    container.bind({ token: CommandBus, value: new CommandBus() });
  }

  dbg.info(prefix(__filename), "Injecting bindings on creation:", { container, config, options });

  if (config.bindings) {
    for (const binding of config.bindings) {
      container.bind(applySkipActivationHooks(binding, options.skipActivationHooks));
    }
  }

  for (const binding of activate) {
    container.get(binding);
  }

  return container;
}
