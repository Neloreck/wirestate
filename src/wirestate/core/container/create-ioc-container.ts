import { Container } from "inversify";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { InitialState } from "@/wirestate/core/initial-state/initial-state";
import { QueryBus } from "@/wirestate/core/queries/query-bus";
import {
  INITIAL_STATE_SHARED_TOKEN,
  INITIAL_STATE_TOKEN,
  QUERY_BUS_TOKEN,
  SIGNAL_BUS_TOKEN,
} from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";

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
  log.info(prefix(__filename), "Creating IOC container:", { options });

  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });

  const initialState: InitialState = new InitialState();

  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(INITIAL_STATE_TOKEN).toConstantValue(new InitialState());
  container.bind(INITIAL_STATE_SHARED_TOKEN).toConstantValue(initialState.getShared());

  log.info(prefix(__filename), "Created IOC container:", { container, options, initialState });

  return container;
}
