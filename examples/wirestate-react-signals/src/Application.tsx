import "./Application.css";

import { useInjection, useEvent, useAllEvents, useEvents } from "@wirestate/react";
import { useEffect } from "react";

import { EventsLog } from "@/components/EventsLog";
import { GeneralControls } from "@/components/GeneralControls";
import { QueriesData } from "@/components/QueriesData";
import { EGlobalEvent } from "@/constants/events";
import { GLOBAL_CONFIG } from "@/constants/id";
import { ThemeService } from "@/services/ThemeService";

export function Application() {
  const themeService: ThemeService = useInjection(ThemeService);
  const globalConfig: object = useInjection(GLOBAL_CONFIG);

  useEvent(EGlobalEvent.COUNTER_RESET, () => {
    console.info("[Application] Counter was reset (specific event)");
  });

  useEvents([EGlobalEvent.COUNTER_RESET], () => {
    console.info("[Application] Counter was reset (array of events)");
  });

  useAllEvents((event) => {
    console.info("[Application] Log all events:", event.type, event.payload, event.source);
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeService.theme.value;
  }, [themeService.theme.value]);

  return (
    <div className={"app"}>
      <header className={"app-header"}>
        <h1>Wirestate</h1>
        <p className={"app-header__stack"}>React + Signals</p>
        <p className={"app-header__lead"}>
          Dependency-injected services with events, commands, queries, and reactive Preact Signals state.
        </p>
      </header>

      <section id={"controls"} className={"panel"}>
        <h2>Counter &amp; controls</h2>
        <p className={"panel__desc"}>
          State lives in injected services. Buttons call service methods, emit an event, and run a command.
        </p>
        <GeneralControls />
      </section>

      <section id={"events-log"} className={"panel"}>
        <h2>Events log</h2>
        <p className={"panel__desc"}>LoggerService records every event emitted inside the container.</p>
        <EventsLog />
      </section>

      <section id={"queries-data"} className={"panel"}>
        <h2>Queries</h2>
        <p className={"panel__desc"}>Pull data from service query handlers — synchronously or async.</p>
        <QueriesData />
      </section>

      <section id={"global-config"} className={"panel"}>
        <h2>Container config</h2>
        <p className={"panel__desc"}>A constant value bound in the dependency-injection container.</p>
        <code className={"config"}>{JSON.stringify(globalConfig)}</code>
      </section>
    </div>
  );
}
