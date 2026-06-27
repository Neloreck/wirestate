/**
 * React integration APIs for providers, injection hooks, and component-scoped message handlers.
 *
 * @packageDocumentation
 */

export { useOnCommand } from "./commands/use-on-command";

export { ContainerContext } from "./container/container-context";
export { useContainer } from "./container/use-container";

export { useOnEvents } from "./events/use-on-events";

export { type InjectionFallback, useInjection } from "./injection/use-injection";

export { type ContainerProviderProps } from "./provision/container-provider";
export { ContainerProvider } from "./provision/container-provider";

export { useOnQuery } from "./queries/use-on-query";
