import { type PropsWithChildren, useMemo } from "react";

import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService, type ICounterSeed } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";
import {
  BindingType,
  ContainerActivator,
  ContainerProvider,
  type CreateContainerOptions,
  ScopeBindingType,
} from "@/wirestate-react-signals";

export function Provider({ children }: PropsWithChildren) {
  const container: CreateContainerOptions = useMemo(
    () => ({
      seed: {
        isShared: true,
        // eslint-disable-next-line react-hooks/purity
        initialisedAt: Date.now(),
      },
      seeds: [
        [LoggerService, { logs: [] }],
        [CounterService, { count: 10 } as ICounterSeed],
      ],
      entries: [
        LoggerService,
        ThemeService,
        CounterService,
        // [*] Pass DI check - allow injecting static values / configs.
        {
          id: GLOBAL_CONFIG,
          value: { first: 1, second: 2, third: null, random: 654321 },
        },
        // [*] Pass DI check - allow injecting dynamic values / configs.
        {
          id: GLOBAL_DYNAMIC_CONFIG,
          value: { random: 123456, another: true },
          bindingType: BindingType.DynamicValue,
          scopeBindingType: ScopeBindingType.Singleton,
        },
      ],
    }),
    [],
  );

  return (
    <ContainerProvider container={container}>
      <ContainerActivator activate={[LoggerService]}>
        {children}
      </ContainerActivator>
    </ContainerProvider>
  );
}
