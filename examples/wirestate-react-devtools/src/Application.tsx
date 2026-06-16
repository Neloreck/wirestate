import "./Application.css";

import { useAllEvents, useEvent, useEvents, useInjection } from "@wirestate/react";
import { useEffect } from "react";

import { DevToolsPanel } from "@/components/DevToolsPanel";
import { EventsLog } from "@/components/EventsLog";
import { GeneralControls } from "@/components/GeneralControls";
import { QueriesData } from "@/components/QueriesData";
import { EGlobalEvent } from "@/constants/events";
import { ThemeService } from "@/services/ThemeService";

export const Application = () => {
  const { theme } = useInjection(ThemeService);

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
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className={"app"}>
      <header className={"app-header"}>
        <h1>Wirestate</h1>
        <p className={"app-header__stack"}>React + MobX</p>
        <p className={"app-header__lead"}>
          Dependency-injected services with events, commands, queries, and reactive MobX state.
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

      <section id={"devtools"} className={"panel"}>
        <h2>DevTools inspector</h2>
        <p className={"panel__desc"}>
          A consumer reading the in-page devtools hook: the container tree on the left, the live lifecycle / message /
          registration stream on the right.
        </p>
        <DevToolsPanel />
      </section>
    </div>
  );
};
