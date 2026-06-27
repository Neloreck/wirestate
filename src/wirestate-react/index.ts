/**
 * React integration APIs for providers, injection hooks, and component-scoped message handlers.
 *
 * @packageDocumentation
 */

export { useCommandExecutor } from "./commands/use-command-executor";
export { useCommandExecutorAsync } from "./commands/use-command-executor-async";
export { useOnCommand } from "./commands/use-on-command";

export { ContainerContext } from "./context/container-context";
export { useContainer } from "./context/use-container";

export { useOnEvents } from "./events/use-on-events";
export { useEventEmitter } from "./events/use-event-emitter";

export { type InjectionFallback, useInjection } from "./injection/use-injection";

export { type ContainerProviderProps } from "./provision/container-provider";
export { ContainerProvider } from "./provision/container-provider";

export { useQueryExecutor } from "./queries/use-query-executor";
export { useQueryExecutorAsync } from "./queries/use-query-executor-async";
export { useOnQuery } from "./queries/use-on-query";

export { type CommandExecutor, type CommandExecutorAsync } from "./commands/commands";
export { type EventEmitter } from "./events/events";
export { type QueryExecutor, type QueryExecutorAsync } from "./queries/queries";
