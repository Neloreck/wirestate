import { BindingType, BindingScope, type ContainerConfig } from "@wirestate/core";
import { ContainerProvider } from "@wirestate/react";
import { type PropsWithChildren, useMemo } from "react";

import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService, type ICounterSeed } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

export function Provider({ children }: PropsWithChildren) {
  const config: ContainerConfig = useMemo(
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
          token: GLOBAL_CONFIG,
          // eslint-disable-next-line react-hooks/purity
          value: { first: 1, second: 2, third: null, random: Math.random() },
        },
        {
          token: GLOBAL_DYNAMIC_CONFIG,
          type: BindingType.Factory,
          scope: BindingScope.Singleton,
          factory: () => ({ random: Math.random(), another: true }),
        },
      ],
    }),
    [],
  );

  return <ContainerProvider config={config}>{children}</ContainerProvider>;
}
