import {
  BindingType,
  BindingScope,
  type ContainerConfig,
  EventsPlugin,
  CommandsPlugin,
  QueriesPlugin,
} from "@wirestate/core";
import { DevToolsPlugin } from "@wirestate/core/devtools";
import { ContainerProvider } from "@wirestate/react";
import { type PropsWithChildren, useMemo } from "react";

import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

export function Provider({ children }: PropsWithChildren) {
  const config: ContainerConfig = useMemo(
    () => ({
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
          factory: () => ({ random: Math.random(), another: true }),
          type: BindingType.Factory,
          scope: BindingScope.Singleton,
        },
      ],
      plugins: [
        new EventsPlugin(),
        new CommandsPlugin(),
        new QueriesPlugin(),
        ...(import.meta.env.DEV ? [new DevToolsPlugin({ label: "Wirestate — React + Signals" })] : []),
      ],
    }),
    [],
  );

  return <ContainerProvider config={config}>{children}</ContainerProvider>;
}
