import { Container } from "inversify";

import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { applySeeds } from "../seeds/apply-seeds";
import { SEED_TOKEN } from "../seeds/tokens";
import { SEEDS_TOKEN } from "../seeds/tokens";
import { AnyObject } from "../types/general";
import { SeedEntries, SeedsMap } from "../types/initial-state";

/**
 * Represents configuration options for {@link createBaseContainer}.
 *
 * @group Container
 */
export interface CreateBaseContainerOptions {
  /**
   * Optional parent container.
   * Enables hierarchical resolution and sharing of bindings.
   */
  readonly parent?: Container;

  /**
   * Initial data for the root seed.
   * Accessible via {@link WireScope.getSeed}() in services.
   */
  readonly seed?: AnyObject;

  /**
   * Targeted seeds bound to specific injectables or tokens.
   */
  readonly seeds?: SeedEntries;
}

/**
 * Creates the foundational {@link Container} used by Wirestate.
 *
 * @remarks
 * This helper configures the core container primitives shared by higher-level
 * container factories:
 * - sets the default scope to `Singleton`
 * - binds the core buses: {@link EventBus}, {@link QueryBus}, and {@link CommandBus}
 * - registers the seed map tokens: `SEEDS_TOKEN` and `SEED_TOKEN`
 * - applies any targeted seed entries passed in `options.seeds`
 *
 * @group Container
 * @internal
 *
 * @param options - Base container configuration.
 * @returns A configured {@link Container} instance.
 *
 * @example
 * ```typescript
 * const SOME_TOKEN: unique symbol = Symbol("SOME_TOKEN");
 *
 * const container: Container = createBaseContainer({
 *   seed: { environment: "test" },
 *   seeds: [
 *     [SOME_TOKEN, { value: 123 }],
 *   ],
 * });
 *
 * const rootSeed = container.get(SEED_TOKEN);
 * ```
 */
export function createBaseContainer(options: CreateBaseContainerOptions): Container {
  const container: Container = new Container({
    parent: options.parent,
    defaultScope: "Singleton",
  });

  container.bind(EventBus).toConstantValue(new EventBus());
  container.bind(QueryBus).toConstantValue(new QueryBus());
  container.bind(CommandBus).toConstantValue(new CommandBus());

  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as SeedsMap);
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});

  if (options.seeds) {
    applySeeds(container, options.seeds);
  }

  return container;
}
