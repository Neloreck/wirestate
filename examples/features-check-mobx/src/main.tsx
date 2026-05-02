import "reflect-metadata";
import "@/application/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Application } from "@/application/Application";
import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/core/id";
import { CounterService, type ICounterSeed } from "@/core/services/counter";
import { LoggerService } from "@/core/services/logging";
import { ThemeService } from "@/core/services/theme";
import {
  createInjectablesProvider,
  IocProvider,
  ScopeBindingType,
  type SeedEntries,
  type InjectablesProvider,
  BindingType,
} from "@/libs/wirestate";

// [*] Pass IOC check - separation of container and services provision.
const ServicesProvider: InjectablesProvider = createInjectablesProvider(
  [
    CounterService,
    ThemeService,
    LoggerService,
    // [*] Pass DI check - allow injecting static values / configs.
    {
      id: GLOBAL_CONFIG,
      value: { first: 1, second: 2, third: null, random: Math.random() },
    },
    // [*] Pass DI check - allow injecting dynamic values / configs.
    {
      id: GLOBAL_DYNAMIC_CONFIG,
      value: { random: Math.random(), another: true },
      bindingType: BindingType.DynamicValue,
      scopeBindingType: ScopeBindingType.Singleton,
    },
  ],
  {
    // [*] Pass DI check - force init for required services.
    activate: [LoggerService],
  },
);

// [*] Pass global initial state check - hydration/configs on provision.
const SEED: Record<string, unknown> = {
  isShared: true,
  initialisedAt: Date.now(),
};

// [*] Pass global initial state check with small bonus -> bound initial states.
const SEEDS: SeedEntries = [
  [CounterService, { count: 10 } as ICounterSeed],
  [LoggerService, { logs: [] }],
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IocProvider seed={SEED}>
      <ServicesProvider seeds={SEEDS}>
        <Application />
      </ServicesProvider>
    </IocProvider>
  </StrictMode>,
);
