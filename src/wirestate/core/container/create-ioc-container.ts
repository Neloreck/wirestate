import { Container } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QueryBus } from "@/wirestate/core/queries/query-bus";
import { SEED_TOKEN, SEEDS_TOKEN, QUERY_BUS_TOKEN, SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TAnyObject } from "@/wirestate/types/general";
import type { TSeedsMap } from "@/wirestate/types/initial-state";

export interface ICreateIocContainerOptions {
  /**
   * Parent container for inheritance.
   */
  readonly parent?: Container;
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

  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(SEEDS_TOKEN).toConstantValue(new Map() as TSeedsMap);
  container.bind(SEED_TOKEN).toConstantValue({} as TAnyObject);

  dbg.info(prefix(__filename), "Created IOC container:", { container, options });

  return container;
}
