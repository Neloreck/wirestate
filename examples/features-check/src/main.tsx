import "reflect-metadata";
import "@/application/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Application } from "@/application/Application";
import { GLOBAL_CONFIG } from "@/core/id";
import {
  CounterService,
  type ICounterInitialState,
} from "@/core/services/counter";
import { LoggerService } from "@/core/services/logging";
import { ThemeService } from "@/core/services/theme";
import {
  createInjectablesProvider,
  type InitialStateEntries,
  IocProvider,
  type InjectablesProvider,
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
  ],
  {
    // [*] Pass DI check - force init for required services.
    activate: [GLOBAL_CONFIG, LoggerService],
  },
);

// [*] Pass global initial state check - hydration/configs on provision.
const INITIAL_STATE: Record<string, unknown> = {
  isShared: true,
  initialisedAt: Date.now(),
};

// [*] Pass global initial state check with small bonus -> bound initial states.
const INITIAL_STATES: InitialStateEntries = [
  [CounterService, { count: 10 } as ICounterInitialState],
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IocProvider>
      <ServicesProvider
        initialState={INITIAL_STATE}
        initialStates={INITIAL_STATES}
      >
        <Application />
      </ServicesProvider>
    </IocProvider>
  </StrictMode>,
);
