import { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "../commands/command-bus";
import { EventBus } from "../events/event-bus";
import { QueryBus } from "../queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN } from "../registry";
import type { AnyObject } from "../types/general";
import type { SeedsMap } from "../types/initial-state";

import { WireScope } from "./wire-scope";

/**
 * Represents configuration options for {@link createIocContainer}.
 *
 * @group container
 */
export interface CreateIocContainerOptions {
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
}

/**
 * Creates an Inversify IoC container pre-configured with Wirestate essentials.
 *
 * @remarks
 * The container is initialized with:
 * - State management tokens: `SEEDS_TOKEN` and `SEED_TOKEN`.
 * - Messaging buses: {@link EventBus}, {@link QueryBus}, {@link CommandBus}.
 * - Service bridge: {@link WireScope} (bound in transient scope).
 * - Default scope set to `Singleton`.
 *
 * @group container
 *
 * @param options - {@link Container} configuration.
 * @returns A new Inversify {@link Container} instance.
 *
 * @example
 * ```typescript
 * const container: Container = createIocContainer({
 *   seed: { apiUrl: "https://api.example.com" }
 * });
 *
 * bindService(container, MyService);
 * ```
 */
export function createIocContainer(options: CreateIocContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { options });

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });

  container.bind(EventBus).toConstantValue(new EventBus());
  container.bind(QueryBus).toConstantValue(new QueryBus());
  container.bind(CommandBus).toConstantValue(new CommandBus());
  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as SeedsMap);
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});

  container
    .bind(WireScope)
    .toResolvedValue((): WireScope => new WireScope(container))
    .inTransientScope();

  dbg.info(prefix(__filename), "Created IOC container:", { container, options });

  return container;
}
