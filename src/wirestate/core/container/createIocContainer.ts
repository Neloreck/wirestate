import { Container } from "inversify";

import { InitialState } from "@/wirestate/core/initial-state/InitialState";
import { QueryBus } from "@/wirestate/core/queries/QueryBus";
import {
  INITIAL_STATE_SHARED_TOKEN,
  INITIAL_STATE_TOKEN,
  QUERY_BUS_TOKEN,
  SIGNAL_BUS_TOKEN,
} from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/SignalBus";

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
 */
export function createIocContainer(options: ICreateIocContainerOptions = {}): Container {
  const container: Container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });

  const initialState: InitialState = new InitialState();

  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(INITIAL_STATE_TOKEN).toConstantValue(new InitialState());
  container.bind(INITIAL_STATE_SHARED_TOKEN).toConstantValue(initialState.getShared());

  return container;
}
