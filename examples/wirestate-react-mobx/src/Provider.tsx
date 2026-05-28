import {
  BindingType,
  type CreateContainerOptions,
  ScopeBindingType,
} from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { type PropsWithChildren, useMemo } from "react";

import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService, type ICounterSeed } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

export function Provider({ children }: PropsWithChildren) {
  const config: CreateContainerOptions = useMemo(
    () => ({
      seed: {
        isShared: true,
        // eslint-disable-next-line react-hooks/purity
        initialisedAt: Date.now(),
      },
      seeds: [
        [CounterService, { count: 10 } as ICounterSeed],
        [LoggerService, { logs: [] }],
      ],
      bindings: [
        LoggerService,
        CounterService,
        ThemeService,
        {
          id: GLOBAL_CONFIG,
          // eslint-disable-next-line react-hooks/purity
          value: { first: 1, second: 2, third: null, random: Math.random() },
        },
        {
          id: GLOBAL_DYNAMIC_CONFIG,
          // eslint-disable-next-line react-hooks/purity
          value: { random: Math.random(), another: true },
          bindingType: BindingType.DynamicValue,
          scopeBindingType: ScopeBindingType.Singleton,
        },
      ],
    }),
    [],
  );

  return <ContainerProvider config={config}>{children}</ContainerProvider>;
}
