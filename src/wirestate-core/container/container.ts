import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Bindings } from "../binding/binding";
import { Identifier } from "../binding/binding-tokens";
import { CommandBus } from "../commands/command-bus";
import { getConfiguredInternalErrorHandler, setInternalErrorHandler } from "../error/internal-error-handler";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { InternalErrorHandler } from "../types/error";
import { AnyObject, Maybe } from "../types/general";
import { SeedBindings, SeedsMap } from "../types/seeds";

import { setActivationAdapter } from "./activation-adapter";
import { ContainerKernel } from "./container-kernel";
import { getBindingToken } from "./get-binding-token";
import { messagingActivationAdapter } from "./messaging-activation";
import { SEED_TOKEN, SEEDS_TOKEN } from "./seeds";
import { validateContainerConfig } from "./validate-container-config";
import { WireScope } from "./wire-scope";

/**
 * Describes reusable {@link Container} construction config.
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
 * Describes options for {@link Container} construction.
 *
 * @group Container
 */
export interface ContainerOptions {
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
}

/**
 * A Wirestate-ready dependency injection container.
 *
 * @remarks
 * Extends the bare {@link ContainerKernel} with the Wirestate composition:
 *
 * @group Container
 *
 * @throws {@link WirestateError} If `activate` names a token missing from `bindings`.
 *
 * @example
 * ```typescript
 * import { Container, Injectable } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * @Injectable()
 * class CounterService {}
 *
 * const container: Container = new Container({
 *   activate: [LoggerService],
 *   bindings: [CounterService, LoggerService],
 *   seeds: [[CounterService, { count: 10 }]],
 * });
 *
 * const logger = container.get(LoggerService);
 * ```
 */
export class Container extends ContainerKernel {
  /**
   * Creates a Wirestate container.
   *
   * @param config - Container setup config.
   * @param options - Container creation options.
   */
  public constructor(config: ContainerConfig = {}, options: ContainerOptions = {}) {
    dbg.info(prefix(__filename), "Creating container:", { config, options });

    validateContainerConfig(config);

    super(config.parent);

    // Installed before any binding activates; the adapter resolves buses with
    // optional lookups, so it is installed even under `skipMessaging`.
    setActivationAdapter(this, messagingActivationAdapter);

    const activate: ReadonlyArray<Identifier> =
      (config.activate === true ? config.bindings?.map(getBindingToken) : config.activate) || [];

    const errorHandler: Maybe<InternalErrorHandler> =
      config.onError ?? getConfiguredInternalErrorHandler(config.parent);

    this.bind({ token: Container, value: this });

    // Merge with parent seeds map.
    const seeds = new Map(
      config.parent?.has(SEEDS_TOKEN) ? (config.parent.get<SeedsMap>(SEEDS_TOKEN) ?? []) : []
    ) as SeedsMap;

    if (config.seeds) {
      for (const [key, value] of config.seeds) {
        seeds.set(key, value);
      }
    }

    this.bind({ token: SEEDS_TOKEN, value: seeds });

    // Fallback to parent config as default value.
    this.bind({
      token: SEED_TOKEN,
      value: config.seed ?? (config.parent?.has(SEED_TOKEN) ? (config.parent.get<AnyObject>(SEED_TOKEN) ?? {}) : {}),
    });

    this.bind({
      token: WireScope,
      scope: "Transient",
      factory: (): WireScope => new WireScope(this),
    });

    if (errorHandler) {
      setInternalErrorHandler(this, errorHandler);
    }

    if (!options.skipMessaging) {
      this.bind({ token: EventBus, value: new EventBus(this) });
      this.bind({ token: QueryBus, value: new QueryBus() });
      this.bind({ token: CommandBus, value: new CommandBus() });
    }

    dbg.info(prefix(__filename), "Injecting bindings on creation:", { container: this, config, options });

    if (config.bindings) {
      for (const binding of config.bindings) {
        this.bind(binding);
      }
    }

    for (const binding of activate) {
      this.get(binding);
    }
  }
}
