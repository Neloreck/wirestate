import "reflect-metadata";
import "./styles/index.css";

import {
  BindingType,
  Container,
  createContainer,
  ScopeBindingType,
} from "@wirestate/core";
import { ContainerActivator, ContainerProvider } from "@wirestate/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Application } from "@/Application";
import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG } from "@/constants/id";
import { CounterService, type ICounterSeed } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";

const container: Container = createContainer({
  seed: {
    isShared: true,
    initialisedAt: Date.now(),
  },
  seeds: [
    [CounterService, { count: 10 } as ICounterSeed],
    [LoggerService, { logs: [] }],
  ],
  entries: [
    CounterService,
    ThemeService,
    LoggerService,
    {
      id: GLOBAL_CONFIG,
      value: { first: 1, second: 2, third: null, random: Math.random() },
    },
    {
      id: GLOBAL_DYNAMIC_CONFIG,
      value: { random: Math.random(), another: true },
      bindingType: BindingType.DynamicValue,
      scopeBindingType: ScopeBindingType.Singleton,
    },
  ],
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ContainerProvider container={container}>
      <ContainerActivator activate={[LoggerService]}>
        <Application />
      </ContainerActivator>
    </ContainerProvider>
  </StrictMode>,
);
