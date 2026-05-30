/**
 * React integration APIs for providers, injection hooks, and component-scoped message handlers.
 *
 * @packageDocumentation
 */

export { useCommandExecutor } from "./commands/use-command-executor";
export { useOptionalCommandExecutor } from "./commands/use-optional-command-executor";
export { useCommandHandler } from "./commands/use-command-handler";

export { useContainer } from "./context/use-container";
export { useScope } from "./context/use-scope";

export { useEvent } from "./events/use-event";
export { useEvents } from "./events/use-events";
export { useEventsHandler } from "./events/use-events-handler";
export { useEventEmitter } from "./events/use-event-emitter";

export { useInjection } from "./injection/use-injection";
export { useOptionalInjection } from "./injection/use-optional-injection";

export { ContainerProvider, ContainerProviderProps } from "./provision/container-provider";

export { useQueryExecutor } from "./queries/use-query-executor";
export { useAsyncQueryExecutor } from "./queries/use-async-query-executor";
export { useOptionalQueryExecutor } from "./queries/use-optional-query-executor";
export { useOptionalAsyncQueryExecutor } from "./queries/use-optional-async-query-executor";
export { useQueryHandler } from "./queries/use-query-handler";

export { OptionalCommandExecutor, CommandExecutor } from "./types/commands";
export { EventEmitter } from "./types/events";
export {
  QueryResponder,
  QueryExecutor,
  AsyncQueryExecutor,
  OptionalQueryExecutor,
  OptionalAsyncQueryExecutor,
} from "./types/queries";
