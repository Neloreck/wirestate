/**
 * Lit integration APIs for container providers, injection decorators, and element-scoped message handlers.
 *
 * @packageDocumentation
 */

export { injection, InjectionDecorator, InjectionOptions } from "./consumption/injection";
export {
  optionalInjection,
  OptionalInjectionDecorator,
  OptionalInjectionOptions,
} from "./consumption/optional-injection";
export { useContainer, UseContainerValue } from "./consumption/use-container";
export { useInjection, UseInjectionOptions, UseInjectionValue } from "./consumption/use-injection";
export {
  OptionalInjectionFallback,
  useOptionalInjection,
  UseOptionalInjectionOptions,
  UseOptionalInjectionValue,
} from "./consumption/use-optional-injection";

export { onCommand, OnCommandDecorator } from "./commands/on-command";
export { OnCommandController } from "./commands/on-command-controller";
export { useOnCommand, UseOnCommandOptions } from "./commands/use-on-command";

export { onEvent, OnEventDecorator } from "./events/on-event";
export { OnEventController } from "./events/on-event-controller";
export { useOnEvents, UseOnEventsOptions } from "./events/use-on-events";

export { onQuery, OnQueryDecorator } from "./queries/on-query";
export { OnQueryController } from "./queries/on-query-controller";
export { useOnQuery, UseOnQueryOptions } from "./queries/use-on-query";

export { ContainerContext } from "./context/container-context";

export { ContainerProvider, ContainerProviderOptions } from "./provision/container-provider";
export { provideContainer, ProvideContainerDecorator } from "./provision/provide-container";
export { useContainerProvider, UseContainerProviderOptions } from "./provision/use-container-provision";
