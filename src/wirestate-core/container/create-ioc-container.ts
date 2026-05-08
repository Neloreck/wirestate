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

export interface CreateIocContainerOptions {
  /**
   * Parent container for inheritance.
   */
  readonly parent?: Container;
  /**
   * Optional default seed value.
   */
  readonly seed?: AnyObject;
}

/**
 * Creates an IoC container with framework essentials.
 *
 * @param options - container configuration
 * @returns new IoC container
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
