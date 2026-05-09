import { ContextConsumer } from "@lit/context";
import { ReactiveControllerHost } from "@lit/reactive-element";
import { ServiceIdentifier } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/ioc-context";
import { Optional } from "../types/general";

export interface UseInjectionOptions<T> {
  once?: boolean;
  value?: Optional<T>;
  injectionId: ServiceIdentifier<T>;
}

export interface UseInjectionValue<T> {
  injectionId: ServiceIdentifier<T>;
  value: T;
}

export function useInjection<T extends object, E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  { once, injectionId, value }: UseInjectionOptions<T>
): UseInjectionValue<T> {
  dbg.info(prefix(__filename), "Creating:", {
    host,
    once,
    injectionId,
  });

  const current: UseInjectionValue<T> = { value: value as unknown as T, injectionId };

  new ContextConsumer(host, {
    context: ContainerContext,
    subscribe: !once,
    callback: (it) => {
      current.value = it.container.get(injectionId);
    },
  });

  return current;
}
