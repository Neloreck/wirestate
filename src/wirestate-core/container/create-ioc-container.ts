import { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { CommandBus } from "@/wirestate-core/commands/command-bus";
import { EventBus } from "@/wirestate-core/events/event-bus";
import { QueryBus } from "@/wirestate-core/queries/query-bus";
import {
  COMMAND_BUS_TOKEN,
  SEED_TOKEN,
  SEEDS_TOKEN,
  QUERY_BUS_TOKEN,
  EVENT_BUS_TOKEN,
} from "@/wirestate-core/registry";
import { WireScope } from "@/wirestate-core/scope/wire-scope";
import type { TAnyObject } from "@/wirestate-core/types/general";
import type { TSeedsMap } from "@/wirestate-core/types/initial-state";

export interface ICreateIocContainerOptions {
  /**
   * Parent container for inheritance.
   */
  readonly parent?: Container;
  /**
   * Optional default seed value.
   */
  readonly seed?: TAnyObject;
}

/**
 * Creates an IoC container with framework essentials.
 *
 * @param options - container configuration
 * @returns new IoC container
 */
export function createIocContainer(options: ICreateIocContainerOptions = {}): Container {
  dbg.info(prefix(__filename), "Creating IOC container:", { options });

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });

  container.bind(EVENT_BUS_TOKEN).toConstantValue(new EventBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(COMMAND_BUS_TOKEN).toConstantValue(new CommandBus());
  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as TSeedsMap);
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});

  container
    .bind(WireScope)
    .toResolvedValue((): WireScope => new WireScope(container))
    .inTransientScope();

  dbg.info(prefix(__filename), "Created IOC container:", { container, options });

  return container;
}
