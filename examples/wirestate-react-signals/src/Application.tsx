import "./Application.css";

import { useEffect } from "react";

import { EventsLog } from "@/components/EventsLog";
import { GeneralControls } from "@/components/GeneralControls";
import { QueriesData } from "@/components/QueriesData";
import { EGlobalEvent } from "@/constants/events";
import { GLOBAL_CONFIG } from "@/constants/id";
import { ThemeService } from "@/services/ThemeService";
import {
  useInjection,
  useEvent,
  useEventsHandler,
  useEvents,
} from "@/wirestate-react-signals";

export function Application() {
  const themeService: ThemeService = useInjection(ThemeService);
  const globalConfig: object = useInjection(GLOBAL_CONFIG);

  // [*] Pass reactivity subscription for specific global event in React tree.
  useEvent(EGlobalEvent.COUNTER_RESET, () => {
    console.info("[Application] Counter was reset (specific event)");
  });

  // [*] Pass reactivity subscription for specific global events in React tree.
  useEvents([EGlobalEvent.COUNTER_RESET], () => {
    console.info("[Application] Counter was reset (array of events)");
  });

  // [*] Pass reactivity subscription for all events in React tree.
  useEventsHandler((event) => {
    console.info(
      "[Application] Log all events:",
      event.type,
      event.payload,
      event.from,
    );
  });

  // [*] Pass reactivity check from service, sync DOM and state on signal change.
  useEffect(() => {
    document.documentElement.dataset.theme = themeService.theme.value;
  }, [themeService.theme.value]);

  return (
    <>
      <section id={"controls"} className={"application-section"}>
        <GeneralControls />
      </section>

      <br />

      <section id={"events-log"} className={"application-section"}>
        <EventsLog />
      </section>

      <br />

      <section id={"queries-data"} className={"application-section"}>
        <QueriesData />
      </section>

      <br />

      <section id={"global-config"} className={"application-section"}>
        <b>GlobalConfig: {JSON.stringify(globalConfig)}</b>
      </section>
    </>
  );
}
