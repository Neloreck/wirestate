/**
 * Lit integration APIs for container providers, injection decorators, and element-scoped message handlers.
 *
 * @packageDocumentation
 */

export { type InjectionDecorator, type InjectionOptions } from "./consumption/injection";
export { injection } from "./consumption/injection";
export { type UseContainerValue } from "./consumption/use-container";
export { useContainer } from "./consumption/use-container";
export { type InjectionFallback, type UseInjectionOptions, type UseInjectionValue } from "./consumption/use-injection";
export { useInjection } from "./consumption/use-injection";

export { type OnCommandDecorator } from "./commands/on-command";
export { onCommand } from "./commands/on-command";
export { OnCommandController } from "./commands/on-command-controller";
export { type UseOnCommandOptions } from "./commands/use-on-command";
export { useOnCommand } from "./commands/use-on-command";

export { type OnEventDecorator } from "./events/on-event";
export { onEvent } from "./events/on-event";
export { OnEventController } from "./events/on-event-controller";
export { type UseOnEventsOptions } from "./events/use-on-events";
export { useOnEvents } from "./events/use-on-events";

export { type OnQueryDecorator } from "./queries/on-query";
export { onQuery } from "./queries/on-query";
export { OnQueryController } from "./queries/on-query-controller";
export { type UseOnQueryOptions } from "./queries/use-on-query";
export { useOnQuery } from "./queries/use-on-query";

export { ContainerContext } from "./container/container-context";

export { type ContainerProviderOptions } from "./container/container-provider";
export { ContainerProvider } from "./container/container-provider";
export { type ProvideContainerDecorator } from "./container/provide-container";
export { provideContainer } from "./container/provide-container";
export { type UseContainerProviderOptions } from "./container/use-container-provision";
export { useContainerProvider } from "./container/use-container-provision";
